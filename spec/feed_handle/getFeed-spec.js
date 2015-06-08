var mongoFeedStore = require('../../webserv/feed_handle/utils/mongoFeedStore.js'),
    getFeedFromURL = require('../../webserv/feed_handle/utils/getFeedFromURL.js'),
    simpleModel = require('../../webserv/feed_handle/utils/simpleModel.js'),
    getFeedMaker = require('../../webserv/feed_handle/getFeed.js'),
    getFeed,
    Promise = require('bluebird'),
    mongoConn = require('../../webserv/mongoConnect.js');

describe('getFeed', function () {
    var fakeDb, findOneSpy;
    beforeAll(function () {
        fakeDb = {
            collection: function (name) {return {'name': name}; },
            call: function (method, param) {return fakeDb[method](param); }
        };
        spyOn(mongoConn, 'connection').and.returnValue(fakeDb);

        findOneSpy = jasmine.createSpy('findOneSpy').and.callFake(function (query) {
                        if (query.feedurl === 'spam' || (mongoFeedStore.updateMongoFeedData.calls.count() >0 && query.feedurl === 'eggs' )) {
                            query._id = 'spam';
                            return Promise.resolve(query);
                        }
                        return Promise.resolve(null);
        });

        spyOn(simpleModel, 'make').and.callFake(function (collection) {
            if (collection.name === 'feeds') {
                return {
                    findOne: findOneSpy,
                    collection: collection
                };
            } else {
                return {collection: collection};
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
            spyOn(getFeedFromURL, 'makeRequest').and.returnValue({pretend: 'request'});
            spyOn(getFeedFromURL, 'parseFeed').and.returnValue(Promise.resolve('data'));
            spyOn(mongoFeedStore, 'updateMongoFeedData');
            
            getFeed.add('eggs', 'FOOBAR')
            .then(function (result) {
                expect(getFeedFromURL.makeRequest.calls.allArgs()).toEqual([['eggs']]);
                expect(getFeedFromURL.parseFeed.calls.allArgs()).toEqual([[{pretend: 'request'}]]);
                expect(mongoFeedStore.updateMongoFeedData.calls.count()).toEqual(1);
                expect(mongoFeedStore.updateMongoFeedData).toHaveBeenCalledWith(fakeDb, 'data', 'FOOBAR');
                expect(result).toEqual({feedurl: 'eggs', _id: 'spam'});
            })
            .done(done);
        });
        
        it('should return database results if available (and and not go out the source)', function (done) {
            spyOn(getFeedFromURL, 'makeRequest');
            spyOn(mongoFeedStore, 'updateMongoFeedData');
            
            getFeed.add('spam', 'FOOBAR')
            .then(function (result) {
                expect(getFeedFromURL.makeRequest.calls.count()).toEqual(0);
                expect(mongoFeedStore.updateMongoFeedData.calls.count()).toEqual(0);
                expect(result).toEqual({feedurl: 'spam', _id: 'spam', user_id: 'FOOBAR'});
            })
            .done(done);
        });
    });
});
