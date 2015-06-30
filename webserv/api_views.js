var feedModelMaker = require('./feed_handle/getFeed.js'),
    db = require('./mongoConnect.js'),
    Promise = require('bluebird');

module.exports = function (url_for) {
    var feedModel = feedModelMaker();
    return {
        getAll: function (req, res) {
            var last_update = {dt: new Date('2000-01-01')},
                query = {user_id: req.user._id},
                num,
                meta_promise, items_promise;

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
            if (req.query.older_than) {
                try {
                    var dtOlderThan = new Date(req.query.older_than);
                    query.pubdate = {$lt: dtOlderThan};
                }
                catch (e) {}
            }
            items_promise = db.posts.find(query).sort({pubdate: -1}).limit(num).toArrayAsync()
                .reduce(reducer.bind(last_update, cleanItem), []);

            Promise.props({
                meta: meta_promise,
                items: items_promise
            })
            .then(function (data) {
                res.status(200)
                .set('last-modified', last_update.dt)
                .set('cache-control', 'private, max-age=0, no-cache')
                .json(data);
            })
            .done();
        },
        getFeed: function (req, res) {
            var query_meta = {user_id: req.user._id, _id: req.params.ObjectID},
                query_items = {user_id: req.user._id, meta_id: req.params.ObjectID},
                num = 10;
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
            Promise.props({
                meta: db.feeds.find(query_meta).toArrayAsync().reduce(reducer.bind(null, cleanMeta), []),
                items: db.posts.find(query_items).sort({pubdate: -1}).limit(num).toArrayAsync().reduce(reducer.bind(null, cleanItem), [])
            })
            .then(function (data) {
                res.status(200)
                .set('cache-control', 'private, max-age=0, no-cache')
                .json(data);
            });
        },
        postAdd: function (req, res) {
            if (req.body.feedurl) {
                var feed_url = req.body.feedurl;
                if (feed_url.slice(0, 5) === 'feed:') {
                    feed_url = 'http:' + feed_url.slice(5);
                }
                feedModel.add(feed_url, req.user._id)
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
                return db.posts.call('updateOneAsync', q, {$set: {read: item.read},  $currentDate: {last_update: true}});
            })
            .done();
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

