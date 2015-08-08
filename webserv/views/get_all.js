var db = require('../mongoConnect.js'),
    Promise = require('bluebird'),
    url_for = require('../url_for'),
    util = require('./cleaning_util');

module.exports = function (req, res) {
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

    meta_promise = db.feeds.find(query).toArrayAsync().reduce(util.reducer.bind(last_update, util.cleanMeta), []);

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
            .reduce(util.reducer.bind(last_update, util.cleanItem), []);
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
};
