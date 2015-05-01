var getFeedFromUrl = require('./utils/getFeedFromURL.js'),
    mongoFeedStore = require('./utils/mongoFeedStore.js');

    
module.exports.get = function (url) {
    return mongoFeedStore.getMongoFeedData(mongoFeedStore);
};