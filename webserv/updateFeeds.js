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
        return getFeedFromUrl(feed._id.feedurl, false, false)
        .then(function (feed_data) {
            /* Write over the returned feed URL, incase it's been replaced with a differnt
               cannonical URL */
            feed_data.meta.feedurl = feed._id.feedurl; 
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
