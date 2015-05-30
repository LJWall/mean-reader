var Promise = require('bluebird'); 

module.exports.updateMongoFeedData = function (db, feed_data) {
    var ret = [], m;
    return Promise.resolve(db)  /* Agnostic on getting passed a db or */
    .then(function (_m) {       /* a promise of one.                  */
        m = _m;
        var match = {feedurl: feed_data.meta.feedurl};
        if (feed_data.meta._id) { match._id =  feed_data.meta._id; }
        return m.collection('feeds').findOneAndUpdateAsync(match, {$set: {
            feedurl: feed_data.meta.feedurl,
            title:  feed_data.meta.title,
            description: feed_data.meta.description,
            link: feed_data.meta.link,
            last_update: new Date()
        }}, {upsert: true});
    })
    .then(function (upsert_res) {
        feed_data.items.forEach(function (post) {
            var meta_id = (upsert_res.lastErrorObject.updatedExisting ? upsert_res.value._id : upsert_res.lastErrorObject.upserted);
            var match = {meta_id: meta_id, guid: post.guid};
            if (post._id) { match._id = post._id; }
            ret.push(m.collection('posts').updateOneAsync(match, {$set: {
                meta_id: meta_id,
                guid: post.guid,
                title: post.title,
                link: post.link,
                pubdate: post.pubdate
            }}, {upsert: true}));
        });
        return Promise.all(ret);
    });
};
