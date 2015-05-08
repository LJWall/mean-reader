var getFeedFromUrl = require('./utils/getFeedFromURL.js'),
    mongoFeedStore = require('./utils/mongoFeedStore.js'),
    Promise = require('bluebird');
    
// re-export a bunch of the underying mongo methods
module.exports.get = mongoFeedStore.getMongoFeedData;
module.exports.getMeta = mongoFeedStore.getMongoFeedMeta;
module.exports.getItems = mongoFeedStore.getMongoFeedItems;
module.exports.getItemsByID = mongoFeedStore.getMongoFeedItemsByID;
module.exports.setRead = mongoFeedStore.setRead;

module.exports.add = function (url) {
    return mongoFeedStore.getMongoFeedMeta(url)
    .then(function (meta) {
        if (!meta) {
            return getFeedFromUrl.get(url)
            .then(mongoFeedStore.updateMongoFeedData)
            .then(function () {
                return mongoFeedStore.getMongoFeedData(url);
            });
        } else {
            // it's already in the store, just return the stored data
            return Promise.props({
                meta: meta,
                items: mongoFeedStore.getMongoFeedItems(url)
            });
        }
    });
};
