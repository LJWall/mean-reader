var getFeedFromUrl = require('./feed_handle/utils/getFeedFromURL.js'),
    mongoFeedStore = require('./feed_handle/utils/mongoFeedStore.js'),
    mongoConn = require('./mongoConnect.js');
    
mongoFeedStore.getMongoFeedMeta()
.each(function (meta, index, value)  {
    console.log('Updating', meta.title)
    return getFeedFromUrl.get(meta.feedurl).then(mongoFeedStore.updateMongoFeedData);
})
.then(function () {
    console.log('Done')
    mongoConn.disconnect();
})
.done();