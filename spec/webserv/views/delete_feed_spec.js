var delete_feed = require('../../../webserv/views/delete_feed'),
    Promise = require('bluebird'),
    test_data = require('../api_views_test_data.json'),
    mongoConn = require('../../../webserv/mongoConnect.js'),
    util = require('./setup_util');

describe('deleteFeed method', function () {
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

    it('should delete items and feed data', function (done) {
        spyRes.events.once('responseComplete', function () {
            Promise.join(
                mongoConn.posts.findOneAsync({meta_id: test_data.meta[0]._id}),
                mongoConn.feeds.findOneAsync({_id: test_data.meta[0]._id}),
                function (item, feedData) {
                    expect(item).toBeNull();
                    expect(feedData).toBeNull();
                }
            )
            .done(done);
        });
        delete_feed({user: {_id: 'FOO_UID'}, params: {ObjectID: test_data.meta[0]._id}}, spyRes);
    });

    it('should set an 204 response code', function () {
        spyRes.events.once('responseComplete', function () {
            expect(spyRes.status.calls.allArgs()).toEqual([[204]]);
            expect(spyRes.end.calls.allArgs()).toEqual([[]]);
            done();
        });
        delete_feed({user: {_id: 'FOO_UID'}, params: {ObjectID: test_data.meta[0]._id}}, spyRes);
    });
});
