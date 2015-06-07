var getFeedFromUrl = require('./feed_handle/utils/getFeedFromURL.js'),
    mongoFeedStore = require('./feed_handle/utils/mongoFeedStore.js'),
    config = require('./config.js'),
    mongoConn = require('./mongoConnect.js'),
    db = mongoConn.connection(),
    Promise = require('bluebird');

setTimeout(updateLoop, config.update_initwait);

function updateLoop () {
    updateFeeds()
    .then(function () {
        if (config.update_loopwait) {
            setTimeout(updateLoop, config.update_loopwait);
        } else {
            mongoConn.disconnect();
        }
    })
    .done();
}

function updateFeeds () {
    return db.call('collection', 'feeds')
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
        .then(log.bind(null, 'Updated ' + feed._id.feedurl))
        .catch(function (err) {
            log('Error with ' + feed._id.feedurl + '. Error' + err.toString());
        });
    })
    .then(log.bind(null, 'Done for now'))
    .catch(function (err) {
        log('Aborting current updates. Error' + err.toString());
    });
}

function log (msg) {
    var dt = new Date();
    console.log(dt, msg);
}
