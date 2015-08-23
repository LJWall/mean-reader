var db = require('../mongoConnect.js'),
    Promise = require('bluebird');

module.exports = function (req, res) {
    if (req.body.read === true)  {
        var q_items = {user_id: req.user._id, read: {$ne: true}},
            q_feeds = {user_id: req.user._id};

        if (typeof req.query.starred === 'boolean') {
            if (req.query.starred) {
                q_items.starred = true;
            }
            else {
                q_items.starred = {$ne: true};
            }
        }

        Promise.try(function () {
            if (req.query.label) {
                q_feeds = {
                  user_id: req.user._id,
                  labels: req.query.label
                };
                return db.feeds.find(q_feeds).toArrayAsync()
                .then(function (feeds) {
                    q_items.meta_id = {
                        $in: feeds.map(function (m) {return m._id; })
                    };
                });
            }
        })
        .then(function () {
            return Promise.join(
                db.posts.call('updateManyAsync', q_items, {$set: {read: true},  $currentDate: {last_update: true}}),
                db.feeds.call('updateManyAsync', q_feeds, {$currentDate: {last_update: true}}),
                function () {
                    res.status(204).end();
                }
            );
        })
        .catch(function (e) {
            res.status(500).end();
        });
    } else {
        res.status(400).end();
    }
};
