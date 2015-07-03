var getFeedFromUrl = require('./feed_handle/utils/getFeedFromURL.js'),
    mongoFeedStore = require('./feed_handle/utils/mongoFeedStore.js'),
    config = require('./config.js'),
    db = require('./mongoConnect.js'),
    Promise = require('bluebird'),
    request = Promise.promisifyAll(require('request'));



setTimeout(updateLoop, config.update_initwait);

function updateLoop () {
    updateFeeds()
    .then(function () {
        if (config.update_loopwait) {
            setTimeout(updateLoop, config.update_loopwait);
        } else {
            db.disconnect();
        }
    })
    .done();
}

function updateFeeds () {
    return db.feeds
    .call('aggregateAsync', [
        {$project: {feedurl: true, user_id:true, last_update: true}},
        {$group: {_id: {feedurl: '$feedurl'}, user_ids: {$addToSet: '$user_id'}, last_update: {$min: '$last_update'} }}
    ])
    .each(function (feed, index, value)  {
        return request.headAsync(feed._id.feedurl)
        .then(function (results) {
            var last_mod;
            try {
                last_mod = new Date(results[0].headers['last-modified']);
            } catch (e) {
                return;
            }
            if (feed.last_update > last_mod) {
                // Not sure it's idiomatic to use errors for control flow
                // in JS, but hey ho...
                throw new Error('No recent modifications');
            }
        })
        .then(getFeedFromUrl.bind(null, feed._id.feedurl, false))
        .then(function (feed_data) {
            /* Write over the returned feed URL, incase it's been replaced with a differnt
               cannonical URL */
            feed_data.meta.feedurl = feed._id.feedurl; 
            return Promise.each(feed.user_ids, function (uid) {
                return mongoFeedStore.updateMongoFeedData(feed_data, uid);
            });
        })
        .then(log.bind(null, 'Updated ' + feed._id.feedurl))
        .catch(function (err) {
            log('Not updating ' + feed._id.feedurl + '. Reason: ' + err.message);
        });
    })
    .then(log.bind(null, 'Done for now'))
    .catch(function (err) {
        log('Aborting current updates. Error' + err.message);
        console.log(err.stack);
    });
}

function log (msg) {
    var dt = new Date();
    console.log(dt, msg);
}
