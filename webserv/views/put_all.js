var db = require('../mongoConnect.js'),
    Promise = require('bluebird');

module.exports = function (req, res) {
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
};
