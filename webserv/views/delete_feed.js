var db = require('../mongoConnect.js'),
    Promise = require('bluebird');


module.exports = function (req, res) {
    Promise.join(
        db.posts.call('deleteManyAsync', {meta_id: req.params.ObjectID, user_id: req.user._id}),
        db.feeds.call('deleteOneAsync', {_id: req.params.ObjectID, user_id: req.user._id}),
        function () {
            res.status(204).end();
        }
    );
};
