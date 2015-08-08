var post_feed = require('../../../webserv/views/post_feed'),
    mongoConn = require('../../../webserv/mongoConnect.js'),
    feed_server = require('../feed_handle/test_atomserv/feed_server'),
    url_for = require('../../../webserv/url_for'),
    util = require('./setup_util');

describe('postAdd', function () {

    beforeAll(util.makeResSpy);

    beforeAll(feed_server.startServer);
    afterAll(feed_server.stopServer);

    it('should take two paramters', function () {
        expect(post_feed.length).toEqual(2);
    });

    describe('with good request)', function () {

        afterAll(util.deleteTestData);
        beforeAll(function (done) {
            this.spyRes.events.once('responseComplete', done);
            post_feed({user: {_id: 'FOOBAR'}, body: {feedurl: 'http://127.0.0.1:1337/short.atom'}}, this.spyRes);
        });
        afterAll(util.resetSpies);
        afterAll(util.clearListner);


        it('should set a 201 response code', function () {
            expect(this.spyRes.status.calls.allArgs()).toEqual([[201]]);
        });
        it('should redirect Location header to /feed/[feedID]', function (done) {
            var self = this;
            mongoConn.feeds.findOneAsync().then(function (feed) {
                expect(self.spyRes.set.calls.allArgs()).toEqual([['Location', url_for.feed(feed._id.toString())]]);
            })
            .done(done);
        });
    });

    describe('with bad request', function () {
        beforeAll(function (done) {
            this.spyRes.events.once('responseComplete', done);
            post_feed({user: {_id: 'FOOBAR'}, body: {bad: 'data'}}, this.spyRes);
        });
        afterAll(util.resetSpies);
        afterAll(util.clearListner);
        it('should return return a 400 code.', function () {
            expect(this.spyRes.status.calls.allArgs()).toEqual([[400]]);
        });
    });

    describe('with with feed add routine rejecting promise', function () {
        beforeAll(function (done) {
            this.spyRes.events.once('responseComplete', function () {
                done();
            });
            post_feed({user: {_id: 'FOOBAR'}, body: {feedurl: 'http://127.0.0.1:9999/blah'}}, this.spyRes);
        });
        afterAll(util.resetSpies);
        afterAll(util.clearListner);
        it('should return return a 500 code.', function () {
            expect(this.spyRes.status.calls.allArgs()).toEqual([[500]]);
        });
    });

});
