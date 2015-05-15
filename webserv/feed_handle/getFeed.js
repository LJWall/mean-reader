var getFeedFromUrl = require('./utils/getFeedFromURL.js'),
    mongoFeedStore = require('./utils/mongoFeedStore.js'),
    db_promise = require('../mongoConnect.js').connection(),
    simpleModelMaker = require('./utils/simpleModel.js').make,
    Promise = require('bluebird');

module.exports.feeds = simpleModelMaker(db_promise.call('collection', 'feeds'));
module.exports.posts = simpleModelMaker(db_promise.call('collection', 'posts'));

module.exports.add = function (url) {
    return module.exports.posts.findOne({'feedurl': url})
    .then(function (meta) {
        if (!meta) {
            return getFeedFromUrl.get(url)
            .then(mongoFeedStore.updateMongoFeedData.bind(null, db_promise));
        } else {
            return null;
        }
    });
};
