var rewire = require('rewire'),
    mongoFeedStore = require('../../webserv/feed_handle/utils/mongoFeedStore.js'),
    getFeedFromURL = require('../../webserv/feed_handle/utils/getFeedFromURL.js'),
    getFeed = rewire('../../webserv/feed_handle/getFeed.js'),
    Promise = require('bluebird'),
    db = require('../../webserv/mongoConnect.js');

describe('getFeed', function () {
    describe('.add', function () {
        beforeAll(function () {
            this.fakeFeedData = {meta: {feedurl: 'http://cannonical'}};
            this.getFeedFromURLSpy = jasmine.createSpy('getFeedFromURL').and.returnValue(Promise.resolve(this.fakeFeedData));
            getFeed.__set__('getFeedFromURL', this.getFeedFromURLSpy);
            spyOn(db.feeds, 'findOneAsync');
            spyOn(mongoFeedStore, 'updateMongoFeedData');
        });
        beforeEach(function () {
            this.getFeedFromURLSpy.calls.reset();
        });

        it('should go to the source (and store the result)', function (done) {
            var self = this;
            getFeed('eggs', 'FOOBAR')
            .then(function (result) {
                expect(self.getFeedFromURLSpy.calls.allArgs()).toEqual([['eggs', true, true]]);
                expect(mongoFeedStore.updateMongoFeedData.calls.count()).toEqual(1);
                expect(mongoFeedStore.updateMongoFeedData).toHaveBeenCalledWith(self.fakeFeedData, 'FOOBAR');
                expect(db.feeds.findOneAsync.calls.count()).toEqual(1);
                expect(db.feeds.findOneAsync.calls.argsFor(0)).toEqual([{'feedurl': 'http://cannonical', user_id: 'FOOBAR'}]);
            })
            .done(done);
        });
    });
});
