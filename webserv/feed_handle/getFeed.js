var getFeedFromUrl = require('./utils/getFeedFromURL.js'),
    mongoFeedStore = require('./utils/mongoFeedStore.js'),
    mongoConnect = require('../mongoConnect.js'),
    simpleModel = require('./utils/simpleModel.js'),
    Promise = require('bluebird');

module.exports = function () {
    var obj = {},
        db_promise = mongoConnect.connection();
        
    obj.feeds = simpleModel.make(db_promise.call('collection', 'feeds'));
    obj.posts = simpleModel.make(db_promise.call('collection', 'posts'));
    obj.add = function (url) {
        return obj.posts.findOne({'feedurl': url})
        .then(function (meta) {
            if (!meta) {
                return getFeedFromUrl.get(url)
                .then(mongoFeedStore.updateMongoFeedData.bind(null, db_promise));
            } else {
                return null;
            }
        });
    };
    
    return obj;
};
