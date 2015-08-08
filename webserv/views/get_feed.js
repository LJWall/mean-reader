var db = require('../mongoConnect.js'),
    Promise = require('bluebird'),
    util = require('./cleaning_util');

module.exports = function (req, res) {
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
        posts_promise = db.posts.find(query_items).sort({pubdate: -1}).limit(num).toArrayAsync().reduce(util.reducer.bind(null, util.cleanItem), []);
     } else {
        posts_promise = Promise.resolve([]);
     }

    Promise.join(
        db.feeds.findOneAsync(query_meta).then(util.cleanMeta),
        posts_promise,
        n_unread_promise,
        function (meta, items, n_unread) {
            if (n_unread[0]) meta.unread = n_unread[0].unread;
            res.status(200)
            .json({meta: [meta], items: items});
        }
    );
};
