var Promise = require('bluebird'),
    mongoConn = require('../../mongoConnect.js'),
    ObjectID = require('mongodb').ObjectID; 

module.exports.updateMongoFeedData = function (feed_data) {
    var ret = [], m;
    return mongoConn.connection()
    .then(function (mongodb) {
        m = mongodb;
        feed_data.meta.last_update = new Date();
        var match = {feedurl: feed_data.meta.feedurl}
        if (feed_data.meta._id) { match._id = feed_data.meta._id; } 
        return m.collection('feeds').findOneAndUpdateAsync(match, {$set: feed_data.meta}, {upsert: true})
    })
    .then(function (upsert_res) {
        feed_data.items.forEach(function (post) {
            post.meta_id = (upsert_res.lastErrorObject.updatedExisting ? upsert_res.value._id : upsert_res.lastErrorObject.upserted);
            var match = {feedurl: post.feedurl, guid: post.guid}
            if (post._id) { match._id = post._id; }
            ret.push(m.collection('posts').updateOneAsync(match, {$set: post}, {upsert: true}));
        });
        return Promise.all(ret);
    });
};

module.exports.setRead = function (meta_id, post_guid) {
    return mongoConn.connection()
    .then(function (m) {
        return m.collection('posts').updateOneAsync(
            {meta_id: ObjectID.createFromHexString(meta_id), guid: post_guid},
            {$set: {read: true}},
            {upsert: false}
        );
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

module.exports.getMongoFeedItemsByID = function (id) {
    return mongoConn.connection()
    .then(function (mongodb) {
        return mongodb.collection('posts').find({meta_id: ObjectID.createFromHexString(id)}).toArrayAsync();
    });
};