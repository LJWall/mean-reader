var getFeedFromURL = require('./utils/getFeedFromURL.js'),
    mongoFeedStore = require('./utils/mongoFeedStore.js'),
    db = require('../mongoConnect.js'),
    simpleModel = require('./utils/simpleModel.js'),
    Promise = require('bluebird');

module.exports = function () {
    var obj = {};
    obj.add = function (url, user_id) {
        var newUrl;
        return getFeedFromURL(url, true, true)
        .then(function (data) {
            newUrl = data.meta.feedurl;
            return mongoFeedStore.updateMongoFeedData(db.connection, data, user_id);
        })
        .then(function () {
            return db.feeds.findOneAsync({'feedurl': newUrl, user_id: user_id});
        });
    };
    
    return obj;
};
