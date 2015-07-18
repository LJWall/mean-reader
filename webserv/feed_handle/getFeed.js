var getFeedFromURL = require('./utils/getFeedFromURL.js'),
    mongoFeedStore = require('./utils/mongoFeedStore.js'),
    db = require('../mongoConnect.js'),
    config = require('../config.js');

module.exports = function (url, user_id) {
    var initData,
        initGet,
        depth=0;

    initGet = getFeedFromURL(url, true).tap(function (data) {
        initData = data;
    });

    if (config.addFeedFollowNext) {
        initGet.catch(function (err) {
            /* Just swallow any error here - it will propogate
             * down throught the function return value
             */
        }).then(recurse);
    }

    return initGet.then(function (data) {
        return mongoFeedStore.saveFeedItemContent(data)
        .then(function () {
            return mongoFeedStore.updateMongoFeedData(data, user_id);
        });
    })
    .then(function () {
        return db.feeds.findOneAsync({'feedurl': initData.meta.feedurl, user_id: user_id});
    });

    function recurse (lastData) {
        depth++;
        if (depth===config.addFeedFollowNextMax) {
            return;
        }
        if (lastData && lastData.fullMeta && lastData.fullMeta['atom:link'] && lastData.fullMeta['atom:link'].length) {
            var next = lastData.fullMeta['atom:link'].find(function (ele) {
                return (ele['@'] && ele['@'].rel === 'next');
            });
            if (next) {
                getFeedFromURL(next['@'].href, false)
                .tap(function (nextData) {
                    return mongoFeedStore.saveFeedItemContent(nextData)
                    .then(function () {
                        return mongoFeedStore.updateMongoFeedData({
                            meta: initData.meta,
                            items: nextData.items
                        }, user_id, true);
                    });
                })
                .catch(function (e) {
                    console.error('Error getting', next['@'].href);
                    console.error(e.stack);
                })
                .then(recurse);
            }
        }
    }
};
