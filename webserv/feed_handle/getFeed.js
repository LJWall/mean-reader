var getFeedFromURL = require('./utils/getFeedFromURL.js'),
    mongoFeedStore = require('./utils/mongoFeedStore.js'),
    db = require('../mongoConnect.js');

module.exports = function (url, user_id) {
    var newUrl;
    return getFeedFromURL(url, true, true)
    .then(function (data) {
        newUrl = data.meta.feedurl;
        return mongoFeedStore.updateMongoFeedData(data, user_id);
    })
    .then(function () {
        return db.feeds.findOneAsync({'feedurl': newUrl, user_id: user_id});
    });
};
