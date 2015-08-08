var put_feed = require('../../../webserv/views/put_feed'),
    test_data = require('../api_views_test_data.json'),
    mongoConn = require('../../../webserv/mongoConnect.js'),
    util = require('./setup_util');

describe('putFeed', function () {
    var spyRes;

    beforeAll(util.prepTestData);
    beforeAll(util.makeResSpy);
    beforeAll(function () {
        spyRes = this.spyRes;
    });

    beforeEach(util.insertTestData);

    afterEach(util.resetSpies);
    afterEach(util.clearListner);
    afterEach(util.deleteTestData);

    it('with body={read:true} should set all the items from a feed to read=true', function (done) {
        spyRes.events.once('responseComplete', function () {
            expect(spyRes.status.calls.allArgs()).toEqual([[204]]);
            expect(spyRes.end).toHaveBeenCalled();
            mongoConn.posts.findOneAsync({meta_id: test_data.meta[0]._id})
            .then(function (item) {
                expect(item.read).toBe(true);
            })
            .done(done);
        });
        put_feed({user: {_id: 'FOO_UID'}, body: {read: true}, params: {ObjectID: test_data.meta[0]._id}}, spyRes);
    });

    it('should not set read if {read=true} not in the body', function (done) {
        spyRes.events.once('responseComplete', function () {
            expect(spyRes.status.calls.allArgs()).toEqual([[400]]);
            expect(spyRes.end).toHaveBeenCalled();
            mongoConn.posts.findOneAsync({meta_id: test_data.meta[0]._id})
            .then(function (item) {
                expect(item.read).toBeUndefined();
            })
            .done(done);
        });
        put_feed({user: {_id: 'FOO_UID'}, body: {}, params: {ObjectID: test_data.meta[0]._id}}, spyRes);
    });
    it('should be able to set userTitle if posted', function (done) {
        spyRes.events.once('responseComplete', function () {
            expect(spyRes.status.calls.allArgs()).toEqual([[204]]);
            expect(spyRes.end).toHaveBeenCalled();
            mongoConn.feeds.findOneAsync({_id: test_data.meta[0]._id})
            .then(function (feed) {
                expect(feed.userTitle).toEqual('FooFooFooFooFooFoo');
            })
            .done(done);
        });
        put_feed({user: {_id: 'FOO_UID'}, body: {userTitle: 'FooFooFooFooFooFoo'}, params: {ObjectID: test_data.meta[0]._id}}, spyRes);
    });
    it('should be able to set folder if posted', function (done) {
        spyRes.events.once('responseComplete', function () {
            expect(spyRes.status.calls.allArgs()).toEqual([[204]]);
            expect(spyRes.end).toHaveBeenCalled();
            mongoConn.feeds.findOneAsync({_id: test_data.meta[0]._id})
            .then(function (feed) {
                expect(feed.folder).toEqual('FooFooFooFooFooFoo');
            })
            .done(done);
        });
        put_feed({user: {_id: 'FOO_UID'}, body: {folder: 'FooFooFooFooFooFoo'}, params: {ObjectID: test_data.meta[0]._id}}, spyRes);
    });
});
