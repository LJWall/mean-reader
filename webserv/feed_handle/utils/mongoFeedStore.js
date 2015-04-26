var Promise = require('bluebird'); 

module.exports.updateMongoFeedData = function (feed_data, mongodb) {
    var ret = [];
    feed_data.meta.last_update = new Date();
    ret.push(mongodb.collection('feeds').updateOneAsync({feedurl: feed_data.meta.feedurl}, {$set: feed_data.meta}, {upsert: true}));
    feed_data.items.forEach(function (post) {
        ret.push(mongodb.collection('posts').updateOneAsync({feedurl: post.feedurl, guid: post.guid}, {$set: post}, {upsert: true}));
    });
    return Promise.all(ret);
};

//module.exports.updateFeedFromSource = function (feed_url, mongodb) {
//    return mongodb.collection('feeds').findOneAsync({feedurl: feed_url}).then(function (meta) {
//        if (!meta || (new Date()).getTime() - meta.last_update.getTime() >= 1000*60*45) {
//            return module.exports.getFeedFromSource(feed_url)
//            .then(function (feed_data) {
//                module.exports.updateFeedData(feed_data, mongodb);
//            });
//        }
//        return meta;
//    });
//};

module.exports.getMongoFeedData = function (feed_url, mongodb) {
    // CHANGE THIS, should make the two two calls is parallel...
    var meta_promise = mongodb.collection('feeds')
                                      .findOneAsync({feedurl: feed_url});
    
    return meta_promise.then(function (meta_data) {
        if (meta_data) {
            return mongodb.collection('posts').find({feedurl: feed_url}).toArrayAsync()
                    .then(function (posts_array) {
                        return {meta: meta_data, items: posts_array};
                    });
        } else
            throw new Error('Feed not found in db');
    });
};
