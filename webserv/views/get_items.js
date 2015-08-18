var db = require('../mongoConnect.js'),
    Promise = require('bluebird'),
    url_for = require('../url_for'),
    util = require('./cleaning_util');

module.exports = function (req, res) {
    var last_update = {dt: new Date('2000-01-01')},
        query = {user_id: req.user._id},
        items_promise, num;

    if (typeof req.query.starred === 'boolean') {
        if (req.query.starred) {
            query.starred = true;
        } else {
            query.starred = {$ne: true};
        }
    }

    items_promise = db.posts.find(query).sort({pubdate: -1});

    if (req.query.N) {
        try {
            num = parseInt(req.query.N);
        }
        catch (e) {}
    }
    if (num !== undefined) items_promise = items_promise.limit(num);

    items_promise.toArrayAsync()
    .reduce(util.reducer.bind(last_update, util.cleanItem), [])
    .then(function (items) {
        res.status(200)
        .set('last-modified', last_update.dt)
        .json({items: items});
    });
};
