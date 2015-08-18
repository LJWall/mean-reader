var db = require('../mongoConnect.js'),
    Promise = require('bluebird'),
    url_for = require('../url_for'),
    util = require('./cleaning_util');

module.exports = function (req, res) {
    var last_update = {dt: new Date('2000-01-01')},
        query = {user_id: req.user._id};//,
        //q2 = Object.create(q1);

    db.posts.find(query).sort({pubdate: -1}).toArrayAsync()
    .reduce(util.reducer.bind(last_update, util.cleanItem), [])
    .then(function (items) {
        res.status(200)
        .set('last-modified', last_update.dt)
        .json({items: items});
    });

    /*if (req.query.updated_since) {
        try {
            var dt = new Date(req.query.updated_since);
            q1.last_update = {$gt: dt};
        }
        catch (e) {
            res.status(500).end();
        }
    }

    if (req.query.label) {
        q2.labels = req.query.label;
    }
    db.feeds.find(q2).toArrayAsync()
    .then(function (metaRaw) {
        var metaIdList = metaRaw.map(function (m) {return m._id; }),
            meta = metaRaw.reduce(util.reducer.bind(last_update, util.cleanMeta), []),
            num, items_promise, n_unread_promise;

        n_unread_promise = db.posts.call('aggregateAsync', [
            {$match: {user_id: req.user._id, read: {$ne: true}, meta_id: {$in: metaIdList}}},
            {$group: {_id: '$meta_id', unread: {$sum: 1}}}
        ])
        .then(function (n_unread) {
            var obj = {};
            n_unread.forEach(function (feed) {
                obj[url_for.feed(feed._id.toString())] = feed.unread;
            });
            return obj;
        });

        if (req.query.N) {
            try {
                num = parseInt(req.query.N);
            }
            catch (e) {}
        }

        if (num===0) {
            items_promise = Promise.resolve([]);
        } else {
            if (!q1.last_update) { q1.meta_id = {$in: metaIdList}; } // Urgh! rework this!
            if (req.query.older_than) {
                try {
                    var dtOlderThan = new Date(req.query.older_than);
                    q1.pubdate = {$lt: dtOlderThan};
                }
                catch (e) {}
            }
            items_promise = db.posts.find(q1).sort({pubdate: -1});
            if (num) {
                items_promise = items_promise.limit(num);
            }
            items_promise = items_promise.toArrayAsync()
                .reduce(util.reducer.bind(last_update, util.cleanItem), []);
        }
        Promise.join(items_promise, n_unread_promise, function (items, n_unread) {
            meta.forEach(function (m) {
                m.unread = (n_unread[m.apiurl] ? n_unread[m.apiurl] : 0);
            });
            res.status(200)
            .set('last-modified', last_update.dt)
            .json({meta: meta, items: items});
        });

    });*/
};
