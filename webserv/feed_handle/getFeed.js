var getFeedFromUrl = require('./utils/getFeedFromURL.js'),
    mongoFeedStore = require('./utils/mongoFeedStore.js'),
    Promise = require('bluebird');

    
module.exports.get = function (url) {
    return mongoFeedStore.getMongoFeedMeta(url)
    .then(function (meta) {
        if (!meta) {
            return getFeedFromUrl.get(url)
            .then(mongoFeedStore.updateMongoFeedData)
            .then(function () {
                return mongoFeedStore.getMongoFeedData(url);
            });
        } else {
            return Promise.props({meta: meta, items: mongoFeedStore.getMongoFeedItems(url)});
        }
    });
};