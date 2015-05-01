var mongoFeedStore = require('../../webserv/feed_handle/utils/mongoFeedStore.js'),
    getFeedFromURL = require('../../webserv/feed_handle/utils/getFeedFromURL.js'),
    getFeed = require('../../webserv/feed_handle/getFeed.js'),
    Promise = require('bluebird');    

describe('getFeed', function () {
    var sample_data = {
        meta: {title: 'blog', link: 'http://blog.rss'},
        items: [{title: 'post 1'}, {title: 'post 2'}]
    };
    
    it('should go to the source if not in the database (and store the result)', function (done) {
        var db_contents = {meta: null, items: []};
        spyOn(getFeedFromURL, 'get').and.returnValue(Promise.resolve(sample_data));
        spyOn(mongoFeedStore, 'getMongoFeedMeta').and.callFake(function () {
            return Promise.resolve(db_contents.meta)
        });
        spyOn(mongoFeedStore, 'getMongoFeedItems').and.callFake(function () {
            return Promise.resolve(db_contents.items);
        });
        spyOn(mongoFeedStore, 'updateMongoFeedData').and.callFake(function (new_data) {
            db_contents = new_data;
            return Promise.resolve(1)
        });
        
        getFeed.get('http://blog.rss')
        .then(function (result) {
            expect(mongoFeedStore.getMongoFeedMeta.calls.count()).toEqual(2);
            expect(mongoFeedStore.getMongoFeedMeta.calls.allArgs()).toEqual([['http://blog.rss'], ['http://blog.rss']]);
            expect(mongoFeedStore.getMongoFeedItems.calls.count()).toEqual(1);
            expect(mongoFeedStore.getMongoFeedItems).toHaveBeenCalledWith('http://blog.rss');
            expect(mongoFeedStore.updateMongoFeedData.calls.count()).toEqual(1);
            expect(getFeedFromURL.get.calls.count()).toEqual(1);
            expect(getFeedFromURL.get).toHaveBeenCalledWith('http://blog.rss');
            expect(result).toEqual(sample_data);
        })
        .done(done);
    });
    
    it('should return database results if less than an hour old (and and not go out the source)', function (done) {
        sample_data.meta.last_update = new Date();
        spyOn(getFeedFromURL, 'get');
        spyOn(mongoFeedStore, 'getMongoFeedMeta').and.returnValue(Promise.resolve(sample_data.meta));
        spyOn(mongoFeedStore, 'getMongoFeedItems').and.returnValue(Promise.resolve(sample_data.items));
        
        getFeed.get('http://blog.rss')
        .then(function (result) {
            expect(getFeedFromURL.get.calls.count()).toEqual(0);
            expect(mongoFeedStore.getMongoFeedMeta.calls.count()).toEqual(1);
            expect(mongoFeedStore.getMongoFeedMeta).toHaveBeenCalledWith('http://blog.rss');
            expect(mongoFeedStore.getMongoFeedItems.calls.count()).toEqual(1);
            expect(mongoFeedStore.getMongoFeedItems).toHaveBeenCalledWith('http://blog.rss');
            expect(result).toEqual(sample_data);
        })
        .done(done);
    });
    
    it('should go to the source if the database result is over an hour old (and store the new results)', function (done) {
        sample_data.meta.last_update = new Date(Date.now() - 61*60*1000);
        
        spyOn(getFeedFromURL, 'get').and.returnValue(Promise.resolve(sample_data));
        spyOn(mongoFeedStore, 'getMongoFeedMeta').and.callFake(function () {
            return Promise.resolve(sample_data.meta)
        });
        spyOn(mongoFeedStore, 'getMongoFeedItems').and.returnValue(Promise.resolve(sample_data.items));
        spyOn(mongoFeedStore, 'updateMongoFeedData').and.callFake(function () {
            sample_data.meta.last_update = new Date();
            return Promise.resolve(1)
        });
        
        getFeed.get('http://blog.rss')
        .then(function (result) {
            expect(mongoFeedStore.getMongoFeedMeta.calls.count()).toEqual(2);
            expect(mongoFeedStore.getMongoFeedMeta.calls.allArgs()).toEqual([['http://blog.rss'], ['http://blog.rss']]);
            expect(mongoFeedStore.getMongoFeedItems.calls.count()).toEqual(1);
            expect(mongoFeedStore.getMongoFeedItems).toHaveBeenCalledWith('http://blog.rss');
            expect(mongoFeedStore.updateMongoFeedData.calls.count()).toEqual(1);
            expect(getFeedFromURL.get.calls.count()).toEqual(1);
            expect(getFeedFromURL.get).toHaveBeenCalledWith('http://blog.rss');
            expect(result).toEqual(sample_data);
        })
        .done(done);
    });
    
});