var db = require('../mongoConnect.js'),
    Promise = require('bluebird'),
    util = require('./cleaning_util');

module.exports = function (req, res) {
    var q = {_id: req.params.ObjectID, user_id: req.user._id};
    db.posts.findOneAsync(q)
    .tap(function (item) {
        var updateRead, updateStarred;
        if (item && typeof req.body.read === 'boolean') {
            item.read = req.body.read;
            updateRead = Promise.all([
                db.posts.call('updateOneAsync', q, {$set: {read: item.read},  $currentDate: {last_update: true}}),
                db.feeds.call('updateOneAsync', {_id: item.meta_id, user_id: req.user._id}, {$currentDate: {last_update: true}})
            ]);
        }
        if (item && typeof req.body.starred === 'boolean') {
            item.starred = req.body.starred;
            updateStarred = Promise.all([
                db.posts.call('updateOneAsync', q, {$set: {starred: item.starred},  $currentDate: {last_update: true}}),
                db.feeds.call('updateOneAsync', {_id: item.meta_id, user_id: req.user._id}, {$currentDate: {last_update: true}})
            ]);
        }
        return Promise.all([updateRead, updateStarred]);
    })
    .then(function (item) {
        if (item) {
            res.status(200).json(util.cleanItem(item));
        } else {
            res.status(404).end();
        }
    })
    .done();
};
