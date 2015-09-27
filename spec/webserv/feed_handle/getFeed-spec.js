var rewire = require('rewire'),
    mongoFeedStore = require('../../../webserv/feed_handle/utils/mongoFeedStore.js'),
    getFeedFromURL = require('../../../webserv/feed_handle/utils/getFeedFromURL.js'),
    getFeed = rewire('../../../webserv/feed_handle/getFeed.js'),
    Promise = require('bluebird'),
    db = require('../../../webserv/mongoConnect.js');

describe('getFeed', function () {
    describe('[basic process]', function () {
        beforeAll(function () {
            this.fakeFeedData = {meta: {feedurl: 'http://cannonical'}};
            this.getFeedFromURLSpy = jasmine.createSpy('getFeedFromURL').and.returnValue(Promise.resolve(this.fakeFeedData));
            getFeed.__set__('getFeedFromURL', this.getFeedFromURLSpy);
            spyOn(db.feeds, 'findOneAsync');
            spyOn(mongoFeedStore, 'updateMongoFeedData');
            spyOn(mongoFeedStore, 'saveFeedItemContent').and.returnValue(Promise.resolve('foo'));
        });
        beforeEach(function () {
            this.getFeedFromURLSpy.calls.reset();
            db.feeds.findOneAsync.calls.reset();
            mongoFeedStore.updateMongoFeedData.calls.reset();
        });
        afterAll(function () {
             getFeed.__set__('getFeedFromURL', getFeedFromURL);
        });

        it('should go to the source (and store the result)', function (done) {
            var self = this;
            getFeed('eggs', 'FOOBAR')
            .then(function (result) {
                expect(self.getFeedFromURLSpy.calls.allArgs()).toEqual([['eggs', true]]);
                expect(mongoFeedStore.updateMongoFeedData.calls.count()).toEqual(1);
                expect(mongoFeedStore.updateMongoFeedData).toHaveBeenCalledWith(self.fakeFeedData, 'FOOBAR');
                expect(mongoFeedStore.saveFeedItemContent.calls.count()).toEqual(1);
                expect(mongoFeedStore.saveFeedItemContent).toHaveBeenCalledWith(self.fakeFeedData);
                expect(db.feeds.findOneAsync.calls.count()).toEqual(1);
                expect(db.feeds.findOneAsync.calls.argsFor(0)).toEqual([{'feedurl': 'http://cannonical', user_id: 'FOOBAR'}]);
            })
            .done(done);
        });
    });

    describe('[with connection refused]', function () {
        it('should reject a returned promise', function (done) {
            getFeed('http://localhost:9999/blah', 'FOOBAR')
            .then(function () {
                done.fail('This code should not run...');
            })
            .catch(function (err) {
                expect(err.message).toMatch('connect ECONNREFUSED');
            })
            .done(done);
        });
    });
});
