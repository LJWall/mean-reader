var getFeedFromURL = require('./utils/getFeedFromURL.js'),
    mongoFeedStore = require('./utils/mongoFeedStore.js'),
    mongoConnect = require('../mongoConnect.js'),
    simpleModel = require('./utils/simpleModel.js'),
    Promise = require('bluebird');

module.exports = function () {
    var obj = {},
        db_promise = mongoConnect.connection();
        
    obj.feeds = simpleModel.make(db_promise.call('collection', 'feeds'));
    obj.posts = simpleModel.make(db_promise.call('collection', 'posts'));
    obj.add = function (url, user_id) {
        return obj.feeds.findOne({'feedurl': url, user_id: user_id})
        .then(function (meta) {
            if (!meta) {
                return getFeedFromURL.parseFeed(getFeedFromURL.makeRequest(url))
                .then(function (data) {
                    return mongoFeedStore.updateMongoFeedData(db_promise, data, user_id);
                })
                .then(function () {
                    return obj.feeds.findOne({'feedurl': url});
                });
            } else {
                return meta;
            }
        });
    };
    
    return obj;
};
