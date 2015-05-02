var Promise = require('bluebird'),
    mongoConn = require('../../mongoConnect.js'); 

module.exports.updateMongoFeedData = function (feed_data) {
    var ret = [];
    return mongoConn.connection()
    .then(function (mongodb) {
        feed_data.meta.last_update = new Date();
        ret.push(mongodb.collection('feeds').updateOneAsync({feedurl: feed_data.meta.feedurl}, {$set: feed_data.meta}, {upsert: true}));
        feed_data.items.forEach(function (post) {
            ret.push(mongodb.collection('posts').updateOneAsync({feedurl: post.feedurl, guid: post.guid}, {$set: post}, {upsert: true}));
        });
        return Promise.all(ret);
    });
};

module.exports.getMongoFeedData = function (feed_url) {
    return Promise.props({
        meta: module.exports.getMongoFeedMeta(feed_url),
        items: module.exports.getMongoFeedItems(feed_url)
    });
};

module.exports.getMongoFeedMeta = function (feed_url) {
    return mongoConn.connection()
    .then(function (mongodb) {
        if (feed_url) {
            return mongodb.collection('feeds')
                          .findOneAsync({feedurl: feed_url});
       } else {
            return mongodb.collection('feeds')
                          .find({})
                          .toArrayAsync();
       }
        
    });
};

module.exports.getMongoFeedItems = function (feed_url) {
    return mongoConn.connection()
    .then(function (mongodb) {
        var search_term = (feed_url ? {feedurl: feed_url} : {});
        return mongodb.collection('posts').find(search_term).toArrayAsync();
    });
};
