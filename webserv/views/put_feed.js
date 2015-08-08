var db = require('../mongoConnect.js'),
    Promise = require('bluebird');

module.exports = function (req, res) {
    var q, readPromise, namePromise, labelsPromise;
    if (req.body.read === true)  {
        q = {meta_id: req.params.ObjectID, user_id: req.user._id, read: {$ne: true}};
        readPromise = Promise.all([
            db.posts.call('updateManyAsync', q, {$set: {read: true},  $currentDate: {last_update: true}}),
            db.feeds.call('updateOneAsync', {_id: req.params.ObjectID, user_id: req.user._id}, {$currentDate: {last_update: true}})
        ]);
    }
    if (req.body.userTitle) {
        namePromise = db.feeds.call('updateOneAsync', {
            _id: req.params.ObjectID,
            user_id: req.user._id
        },
        {
          $set: {'userTitle': req.body.userTitle},
          $currentDate: {'last_update': true}
        });
    }

    if (req.body.labels) {
        labelsPromise = db.feeds.call('updateOneAsync', {
            _id: req.params.ObjectID,
            user_id: req.user._id
        },
        {
          $set: {labels: req.body.labels},
          $currentDate: {'last_update': true}
        });
    }

    if (readPromise || namePromise || labelsPromise) {
        Promise.join(namePromise, readPromise, labelsPromise,
            function () {
                res.status(204).end();
            }
        );
    }
    else {
        res.status(400).end();
    }
};
