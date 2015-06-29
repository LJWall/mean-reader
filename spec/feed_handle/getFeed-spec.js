var rewire = require('rewire'),
    mongoFeedStore = require('../../webserv/feed_handle/utils/mongoFeedStore.js'),
    getFeedFromURL = require('../../webserv/feed_handle/utils/getFeedFromURL.js'),
    simpleModel = require('../../webserv/feed_handle/utils/simpleModel.js'),
    getFeedMaker = rewire('../../webserv/feed_handle/getFeed.js'),
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
        getFeedMaker.__set__('mongoConnect', {connection: fakeDb});

        findOneSpy = jasmine.createSpy('findOneSpy').and.callFake(function (query) {
                        if (query.feedurl === 'http://cannonical' || (mongoFeedStore.updateMongoFeedData.calls.count() >0 && query.feedurl === 'eggs' )) {
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
        beforeAll(function () {
            this.fakeFeedData = {meta: {feedurl: 'http://cannonical'}};
            this.getFeedFromURLSpy = jasmine.createSpy('getFeedFromURL').and.returnValue(Promise.resolve(this.fakeFeedData));
            getFeedMaker.__set__('getFeedFromURL', this.getFeedFromURLSpy);
        });
        beforeEach(function () {
            this.getFeedFromURLSpy.calls.reset();
        });

        it('should go to the source (and store the result)', function (done) {
            var self = this;
            spyOn(mongoFeedStore, 'updateMongoFeedData');
            getFeed.add('eggs', 'FOOBAR')
            .then(function (result) {
                expect(self.getFeedFromURLSpy.calls.allArgs()).toEqual([['eggs', true, true]]);
                expect(mongoFeedStore.updateMongoFeedData.calls.count()).toEqual(1);
                expect(mongoFeedStore.updateMongoFeedData).toHaveBeenCalledWith(fakeDb, self.fakeFeedData, 'FOOBAR');
                expect(result).toEqual({feedurl: 'http://cannonical', _id: 'spam'});
            })
            .done(done);
        });
    });
});
