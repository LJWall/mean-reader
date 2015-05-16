var mongoFeedStore = require('../../webserv/feed_handle/utils/mongoFeedStore.js'),
    getFeedFromURL = require('../../webserv/feed_handle/utils/getFeedFromURL.js'),
    simpleModel = require('../../webserv/feed_handle/utils/simpleModel.js'),
    getFeedMaker = require('../../webserv/feed_handle/getFeed.js'),
    getFeed,
    Promise = require('bluebird'),
    mongoConn = require('../../webserv/mongoConnect.js');

describe('getFeed', function () {
    var fakeDb;
    beforeAll(function () {
        fakeDb = {
            collection: function (name) {return {'name': name}; },
            call: function (method, param) {return fakeDb[method](param); }
        };
        spyOn(mongoConn, 'connection').and.returnValue(fakeDb);
        
        spyOn(simpleModel, 'make').and.callFake(function (collection) {
            return {
                findOne: function (query) {
                    if (query.feedurl === 'spam' || (mongoFeedStore.updateMongoFeedData.calls.count() >0 && query.feedurl === 'eggs' )) {
                        query._id = 'spam';
                        return Promise.resolve(query);
                    }
                    return Promise.resolve(null);
                },
                collection: collection
            }
        });
        
        getFeed = getFeedMaker();
    });
    
    it('should use simpleModel to make feeds object', function () {
        expect(simpleModel.make).toHaveBeenCalledWith({name: 'feeds'});
        expect(getFeed.feeds.collection).toEqual({name: 'feeds'});
    });
    
    it('should use simpleModel to make posts object', function () {
        expect(simpleModel.make).toHaveBeenCalledWith({name: 'posts'});
        expect(getFeed.posts.collection).toEqual({name: 'posts'});
    });
    
    describe('.add', function () {
        it('should go to the source if not in the database (and store the result)', function (done) {
            spyOn(getFeedFromURL, 'get').and.returnValue(Promise.resolve('data'));
            spyOn(mongoFeedStore, 'updateMongoFeedData');
            
            getFeed.add('eggs')
            .then(function (result) {
                expect(getFeedFromURL.get.calls.allArgs()).toEqual([['eggs']]);
                expect(mongoFeedStore.updateMongoFeedData.calls.count()).toEqual(1);
                expect(mongoFeedStore.updateMongoFeedData).toHaveBeenCalledWith(fakeDb, 'data');
                expect(result).toEqual({feedurl: 'eggs', _id: 'spam'})
            })
            .done(done);
        });
        
        it('should return database results if available (and and not go out the source)', function (done) {
            spyOn(getFeedFromURL, 'get');
            spyOn(mongoFeedStore, 'updateMongoFeedData');
            
            getFeed.add('spam')
            .then(function (result) {
                expect(getFeedFromURL.get.calls.count()).toEqual(0);
                expect(mongoFeedStore.updateMongoFeedData.calls.count()).toEqual(0);
                expect(result).toEqual({feedurl: 'spam', _id: 'spam'});
            })
            .done(done);
        });
    });
});