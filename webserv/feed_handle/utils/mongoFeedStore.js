var Promise = require('bluebird'),
    sanitize = require('sanitize-caja'),
    db = require('../../mongoConnect.js');

module.exports.updateMongoFeedData = function (feed_data, user_id, read) {
    var ret = [],
        match = {feedurl: feed_data.meta.feedurl, user_id: user_id};
    return db.feeds.call('findOneAndUpdateAsync', match, {
        $set: {
            feedurl: feed_data.meta.feedurl,
            user_id: user_id,
            title:  feed_data.meta.title,
            description: feed_data.meta.description,
            link: feed_data.meta.link
        },
        $currentDate: {
            last_update: true
        }
    }, {upsert: true})
    .then(function (upsert_res) {
        feed_data.items.forEach(function (post) {
            var meta_id = (upsert_res.lastErrorObject.updatedExisting ? upsert_res.value._id : upsert_res.lastErrorObject.upserted),
                match = {meta_id: meta_id, guid: post.guid, user_id: user_id},
                newData = {
                    meta_id: meta_id,
                    guid: post.guid,
                    user_id: user_id,
                    title: post.title,
                    link: post.link,
                    pubdate: post.pubdate,
                    content_id: post.content_id
                };
            if (read) {newData.read = true; }
            ret.push(db.posts.call('updateOneAsync', match, {
                $set: newData,
                $currentDate: {
                    last_update: true
                }
            }, {upsert: true}));
        });
        return Promise.all(ret);
    });
};

module.exports.saveFeedItemContent = function (feed_data) {
    var ret = [];
    feed_data.items.forEach(function (post) {
        var new_data = {
            guid: post.guid,
            content: sanitize(post.description || post.summary)
        };
        if (new_data.content) {
            ret.push(
                db.content.call('findOneAndUpdateAsync',
                    {guid: post.guid},
                    {$set: new_data},
                    {upsert: true}
                )
                .then(function (upsert_res) {
                    var _id = (upsert_res.lastErrorObject.updatedExisting ? upsert_res.value._id : upsert_res.lastErrorObject.upserted);
                    post.content_id = _id;
                })
            );
        }
    });

    return Promise.all(ret);
};
