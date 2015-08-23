var put_all = require('../../../webserv/views/put_all'),
    test_data = require('../api_views_test_data.json'),
    mongoConn = require('../../../webserv/mongoConnect.js'),
    util = require('./setup_util');

describe('putAll method', function () {
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

    it('with body={read:true} should set all the items for a user to read=true', function (done) {
        spyRes.events.once('responseComplete', function () {
            expect(spyRes.status.calls.allArgs()).toEqual([[204]]);
            expect(spyRes.end).toHaveBeenCalled();
            mongoConn.posts.find({user_id: 'IMPOSTER'}).toArrayAsync()
            .then(function (items) {
                expect(items.length).toEqual(2);
                expect(items[0].read).toEqual(true);
                expect(items[1].read).toEqual(true);
            })
            .done(done);
        });
        put_all({user: {_id: 'IMPOSTER'}, body: {read: true}, query: {}}, spyRes);
    });

    it('should do nothing if {read=true} not in the body', function (done) {
        spyRes.events.once('responseComplete', function () {
            expect(spyRes.status.calls.allArgs()).toEqual([[400]]);
            expect(spyRes.end).toHaveBeenCalled();
            mongoConn.posts.find({user_id: 'IMPOSTER'}).toArrayAsync()
            .then(function (items) {
                expect(items.length).toEqual(2);
                expect(items[0].read).toBeUndefined();
                expect(items[1].read).toBeUndefined();
            })
            .done(done);
        });
        put_all({user: {_id: 'IMPOSTER'}, body: {}, params: {ObjectID: test_data.meta[0]._id}, query: {}}, spyRes);
    });

    it('should repect a query paramter label=foo');

    it('should repect a query paramter starred=true', function (done) {
        spyRes.events.once('responseComplete', function () {
            expect(spyRes.status.calls.allArgs()).toEqual([[204]]);
            expect(spyRes.end).toHaveBeenCalled();
            mongoConn.posts.find({user_id: 'IMPOSTER'}).sort({link: 1}).toArrayAsync()
            .then(function (items) {
                expect(items.length).toEqual(2);
                expect(items[1].read).toBe(true);
                expect(items[0].read).toBeUndefined();
            })
            .done(done);
        });
        put_all({user: {_id: 'IMPOSTER'}, body: {read: true}, params: {}, query: {starred: true}}, spyRes);
    });
});
