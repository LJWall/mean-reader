var getFeedFromUrl = require('./utils/getFeedFromURL.js'),
    mongoFeedStore = require('./utils/mongoFeedStore.js'),
    Promise = require('bluebird');

    
module.exports.get = function (url) {
    return mongoFeedStore.getMongoFeedMeta(url)
    .then(function (meta) {
        if (!meta || Date.now() - meta.last_update.getTime() >= 60*60*1000) {
            return getFeedFromUrl.get(url)
            .then(function (feed_data) {
                return mongoFeedStore.updateMongoFeedData(feed_data)
            })
            .then(function () {
                return mongoFeedStore.getMongoFeedData(url);
            });
        } else {
            return Promise.props({meta: meta, items: mongoFeedStore.getMongoFeedItems(url)});
        }
    });
};