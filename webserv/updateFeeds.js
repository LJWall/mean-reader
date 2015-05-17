var getFeedFromUrl = require('./feed_handle/utils/getFeedFromURL.js'),
    feedModel = require('./feed_handle/getFeed.js')(),
    mongoFeedStore = require('./feed_handle/utils/mongoFeedStore.js'),
    mongoConn = require('./mongoConnect.js');
    db = mongoConn.connection();
    
feedModel.feeds.findMany({})
.each(function (meta, index, value)  {
    console.log('Updating', meta.title)
    return getFeedFromUrl.get(meta.feedurl).then(mongoFeedStore.updateMongoFeedData.bind(null, db));
})
.then(function () {
    console.log('Done')
    mongoConn.disconnect();
})
.done();