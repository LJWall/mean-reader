var db = require('../mongoConnect.js'),
    Promise = require('bluebird'),
    util = require('./cleaning_util');

module.exports = function (req, res) {
    var query_meta = {user_id: req.user._id, _id: req.params.ObjectID},
        query_items = {user_id: req.user._id, meta_id: req.params.ObjectID},
        n_unread_promise, posts_promise;

    n_unread_promise = db.posts.call('aggregateAsync', [
        {$match: {user_id: req.user._id, meta_id: req.params.ObjectID, read: {$ne: true}}},
        {$group: {_id: '$meta_id', unread: {$sum: 1}}}
    ]);

    if (req.query.older_than) {
        query_items.pubdate = {$lt: req.query.older_than};
    }
    if (req.query.N===0) {
        posts_promise = Promise.resolve([]);
    } else {
        posts_promise = db.posts.find(query_items).sort({pubdate: -1});
        if (req.query.N) {
            posts_promise = posts_promise.limit(req.query.N);
        }
        posts_promise = posts_promise.toArrayAsync().reduce(util.reducer.bind(null, util.cleanItem), []);
    }
    Promise.join(
        db.feeds.findOneAsync(query_meta).then(util.cleanMeta),
        posts_promise,
        n_unread_promise,
        function (meta, items, n_unread) {
            if (n_unread[0]) {
                meta.unread = n_unread[0].unread;
            } else {
                meta.unread = 0;
            }
            res.status(200)
            .json({meta: [meta], items: items});
        }
    );
};
