var getFeedFromUrl = require('./feed_handle/utils/getFeedFromURL.js'),
    mongoFeedStore = require('./feed_handle/utils/mongoFeedStore.js'),
    mongoConn = require('./mongoConnect.js'),
    db = mongoConn.connection(),
    Promise = require('bluebird'),
    dt = new Date();

db.call('collection', 'feeds')
.call('aggregateAsync', [
    {$project: {feedurl: true, user_id:true}},
    {$group: {_id: {feedurl: '$feedurl'}, user_ids: {$addToSet: '$user_id'} }}
])
.each(function (feed, index, value)  {
    return getFeedFromUrl.get(feed._id.feedurl)
    .then(function (feed_data) {
        return Promise.each(feed.user_ids, function (uid) {
            return mongoFeedStore.updateMongoFeedData(db, feed_data, uid);
        });
    })
    .then(function () {
        console.log(dt.toString(), 'Updated', feed._id.feedurl);
    })
    .catch(function (err) {
        console.log(dt.toString(), 'Error with', feed._id.feedurl, 'Error', err);
    });
})
.then(function () {
    console.log(dt.toString(), 'Done');
    mongoConn.disconnect();
})
.done();

