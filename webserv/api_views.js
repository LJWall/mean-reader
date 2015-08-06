var addFeed = require('./feed_handle/getFeed.js'),
    db = require('./mongoConnect.js'),
    Promise = require('bluebird');

module.exports = function (url_for) {
    return {
        getAll: function (req, res) {
            var last_update = {dt: new Date('2000-01-01')},
                query = {user_id: req.user._id},
                num,
                meta_promise, items_promise, n_unread_promise;

            n_unread_promise = db.posts.call('aggregateAsync', [
                {$match: {user_id: req.user._id, read: {$ne: true}}},
                {$group: {_id: '$meta_id', unread: {$sum: 1}}}
            ])
            .then(function (n_unread) {
                var obj = {};
                n_unread.forEach(function (feed) {
                    obj[url_for.feed(feed._id.toString())] = feed.unread;
                });
                return obj;
            });

            if (req.query.updated_since) {
                try {
                    var dt = new Date(req.query.updated_since);
                    query.last_update = {$gt: dt};
                }
                catch (e) {
                    res.status(500).end();
                }
            }
            meta_promise = db.feeds.find(query).toArrayAsync().reduce(reducer.bind(last_update, cleanMeta), []);

            num = 10;
            if (req.query.N) {
                try {
                    num = parseInt(req.query.N);
                }
                catch (e) {}
            }
            if (num>0) {
                if (req.query.older_than) {
                    try {
                        var dtOlderThan = new Date(req.query.older_than);
                        query.pubdate = {$lt: dtOlderThan};
                    }
                    catch (e) {}
                }
                items_promise = db.posts.find(query).sort({pubdate: -1}).limit(num).toArrayAsync()
                    .reduce(reducer.bind(last_update, cleanItem), []);
            } else {
                items_promise = Promise.resolve([]);
            }
            Promise.join(meta_promise, items_promise, n_unread_promise, function (meta, items, n_unread) {
                meta.forEach(function (m) {
                    m.unread = n_unread[m.apiurl];
                });
                res.status(200)
                .set('last-modified', last_update.dt)
                .json({meta: meta, items: items});
            });
        },
        getFeed: function (req, res) {
            var query_meta = {user_id: req.user._id, _id: req.params.ObjectID},
                query_items = {user_id: req.user._id, meta_id: req.params.ObjectID},
                num = 10, n_unread_promise, posts_promise;

            n_unread_promise = db.posts.call('aggregateAsync', [
                {$match: {user_id: req.user._id, meta_id: req.params.ObjectID, read: {$ne: true}}},
                {$group: {_id: '$meta_id', unread: {$sum: 1}}}
            ]);

            if (req.query.N) {
                try {
                    num = parseInt(req.query.N);
                }
                catch (e) {}
            }

            if (req.query.older_than) {
                try {
                    var dtOlderThan = new Date(req.query.older_than);
                    query_items.pubdate = {$lt: dtOlderThan};
                }
                catch (e) {}
            }
             if (num>0) {
                posts_promise = db.posts.find(query_items).sort({pubdate: -1}).limit(num).toArrayAsync().reduce(reducer.bind(null, cleanItem), []);
             } else {
                posts_promise = Promise.resolve([]);
             }

            Promise.join(
                db.feeds.findOneAsync(query_meta).then(cleanMeta),
                posts_promise,
                n_unread_promise,
                function (meta, items, n_unread) {
                    if (n_unread[0]) meta.unread = n_unread[0].unread;
                    res.status(200)
                    .json({meta: [meta], items: items});
                }
            );
        },
        postAdd: function (req, res) {
            if (req.body.feedurl) {
                var feed_url = req.body.feedurl;
                if (feed_url.slice(0, 5) === 'feed:') {
                    feed_url = 'http:' + feed_url.slice(5);
                }
                addFeed(feed_url, req.user._id)
                .then(function (meta) {
                    res.status(201).set('Location', url_for.feed(meta._id.toString())).end();
                })
                .catch(function (err) {
                    res.status(500).end();
                })
                .done();
            } else {
                res.status(400).json({error: 'No feed URL in request body'});
            }
        },
        '404': function (req, res) {
            res.status(404).end();
        },
        putPost: function (req, res) {
            var q = {_id: req.params.ObjectID, user_id: req.user._id};
            db.posts.findOneAsync(q)
            .then(function (item) {
                if (!item) {
                    res.status(404).end();
                    return;
                }
                if (typeof req.body.read === 'boolean') {
                    item.read = req.body.read;
                }
                res.status(200).json(cleanItem(item));
                return Promise.all([
                    db.posts.call('updateOneAsync', q, {$set: {read: item.read},  $currentDate: {last_update: true}}),
                    db.feeds.call('updateOneAsync', {_id: item.meta_id, user_id: req.user._id}, {$currentDate: {last_update: true}})
                ]);
            })
            .done();
        },
        putFeed: function (req, res) {
            var q, readPromise, namePromise;
            if (req.body.read === true)  {
                q = {meta_id: req.params.ObjectID, user_id: req.user._id, read: {$ne: true}};
                readPromise = Promise.all([
                    db.posts.call('updateManyAsync', q, {$set: {read: true},  $currentDate: {last_update: true}}),
                    db.feeds.call('updateOneAsync', {_id: req.params.ObjectID, user_id: req.user._id}, {$currentDate: {last_update: true}})

                ]);
            }
            if (req.body.userTitle) {
                namePromise = db.feeds.call('updateOneAsync', {
                    _id: req.params.ObjectID,
                    user_id: req.user._id
                },
                {
                  $set: {'userTitle': req.body.userTitle},
                  $currentDate: {'last_update': true}
                });
            }
            if (readPromise || namePromise) {
                Promise.join(namePromise, readPromise,
                    function () {
                        res.status(204).end();
                    }
                );
            }
            else {
                res.status(400).end();
            }
        },
        deleteFeed: function (req, res) {
            Promise.join(
                db.posts.call('deleteManyAsync', {meta_id: req.params.ObjectID, user_id: req.user._id}),
                db.feeds.call('deleteOneAsync', {_id: req.params.ObjectID, user_id: req.user._id}),
                function () {
                    res.status(204).end();
                }
            );
        },
        putAll: function (req, res) {
            if (req.body.read === true)  {
                var q = {user_id: req.user._id, read: {$ne: true}};
                Promise.join(
                    db.posts.call('updateManyAsync', q, {$set: {read: true},  $currentDate: {last_update: true}}),
                    db.feeds.call('updateManyAsync', {user_id: req.user._id}, {$currentDate: {last_update: true}}),
                    function () {
                        res.status(204).end();
                    }
                );
            } else {
                res.status(400).end();
            }
        },
        getContent: function (req, res) {
            var q = {_id: req.params.ObjectID};
            db.content.findOneAsync(q)
            .then(function (item) {
                if (item) {
                    res.status(200).type('html').set('cache-control', 'public, max-age=604800').send(item.content);
                } else {
                    res.status(404).end();
                }
            });
        }
    };

    function reducer(cleaner, total, item) {
        try {
            total.push(cleaner(item));
            if (item.last_update && item.last_update.getTime() > this.dt.getTime()) {
                this.dt = item.last_update;
            }
        }
        catch (e) {
            // loggging?
        }
        return total;
    }

    function cleanItem (item_data) {
        var obj = {};
        obj.apiurl = url_for.item(item_data._id.toString());
        obj.meta_apiurl =  url_for.feed(item_data.meta_id.toString());
        obj.link =  item_data.link;
        obj.title = item_data.title;
        obj.pubdate = item_data.pubdate;
        obj.read = item_data.read || false;
        if (item_data.content_id) {
            obj.content_apiurl = url_for.content(item_data.content_id);
        }
        return obj;
    }

    function cleanMeta (meta) {
        var obj = {};
        obj.apiurl = url_for.feed(meta._id.toString());
        obj.feedurl =  meta.feedurl;
        if (meta.link) obj.link =  meta.link;
        obj.title = meta.title;
        if (meta.description) { obj.description = meta.description; }
        return obj;
    }
};
