var mongoFeedStore = require('../../webserv/feed_handle/utils/mongoFeedStore.js'),
    getFeedFromURL = require('../../webserv/feed_handle/utils/getFeedFromURL.js'),
    getFeed = require('../../webserv/feed_handle/getFeed.js'),
    Promise = require('bluebird');    

describe('getFeed', function () {
    var sample_data = {
        meta: {title: 'blog', link: 'http://blog.rss'},
        items: [{title: 'post 1'}, {title: 'post 2'}]
    };
    
    it('should go to the source if not in the database (and store the result)');
    
    it('should return database results if less than an hour old (and and not go out the source)', function (done) {
        sample_data.meta.last_update = new Date();
        spyOn(getFeedFromURL, 'get');
        spyOn(mongoFeedStore, 'getMongoFeedMeta').and.returnValue(Promise.resolve(sample_data.meta));
        spyOn(mongoFeedStore, 'getMongoFeedItems').and.returnValue(Promise.resolve(sample_data.items));
        
        getFeed.get('http://blog.rss')
        .then(function (result) {
            expect(getFeedFromURL.get.calls.count()).toEqual(0);
            expect(mongoFeedStore.getMongoFeedMeta.calls.count()).toEqual(1);
            expect(mongoFeedStore.getMongoFeedItems.calls.count()).toEqual(1);
            expect(result).toEqual(sample_data);
        })
        .done(done);
    });
    
    xit('should go to the source if the database result is over an hour old (and store the new results)', function (done) {
        sample_data.meta.last_update = new Date(Date.now() - 61*60*1000);
        spyOn(getFeedFromURL, 'get');
        spyOn(mongoFeedStore, 'getMongoFeedData').and.returnValue(Promise.resolve(sample_data));
        
        getFeed.get('http://blog.rss')
        .then(function (result) {
            expect(1).toEqual(0);
            
        })
        .done(done);
    });
    
});