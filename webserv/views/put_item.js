var db = require('../mongoConnect.js'),
    Promise = require('bluebird'),
    util = require('./cleaning_util');

module.exports = function (req, res) {
    var q = {_id: req.params.ObjectID, user_id: req.user._id},
        updatePromise;
    db.posts.findOneAsync(q)
    .tap(function (item) {
        if (item && typeof req.body.read === 'boolean') {
            item.read = req.body.read;
            updatePromise = Promise.all([
                db.posts.call('updateOneAsync', q, {$set: {read: item.read},  $currentDate: {last_update: true}}),
                db.feeds.call('updateOneAsync', {_id: item.meta_id, user_id: req.user._id}, {$currentDate: {last_update: true}})
            ]);
            return updatePromise;
        }
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
