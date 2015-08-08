var put_item = require('../../../webserv/views/put_item'),
    test_data = require('../api_views_test_data.json'),
    mongoConn = require('../../../webserv/mongoConnect.js'),
    url_for = require('../../../webserv/url_for'),
    util = require('./setup_util');


describe('put_item', function () {
    var spyRes;
    beforeAll(util.prepTestData);
    beforeAll(util.makeResSpy);
    beforeAll(function () {
        spyRes = this.spyRes;
    });

    it('should take two parameters', function () {
        expect(put_item.length).toEqual(2);
    });

    describe('[usual request process]', function () {
        beforeAll(util.insertTestData);
        afterAll(util.deleteTestData);
        beforeAll(function (done) {
            spyRes.events.once('responseComplete', done);
            put_item({user: {_id: 'FOO_UID'}, body: {}, params: {ObjectID: test_data.item[0]._id}}, spyRes);
        });
        afterAll(util.resetSpies);
        afterAll(util.clearListner);

        it('should return a 200 code', function () {
            expect(spyRes.status.calls.allArgs()).toEqual([[200]]);
        });
        it('should return the item data', function () {
            expect(spyRes.json.calls.count()).toEqual(1);
            expect(spyRes.json.calls.argsFor(0)[0]).toEqual({
                apiurl: url_for.item(test_data.item[0]._id),
                meta_apiurl:  url_for.feed(test_data.item[0].meta_id),
                link: test_data.item[0].link,
                title: test_data.item[0].title,
                pubdate: test_data.item[0].pubdate,
                read: false
            });
        });
    });

    // Helper function whcih returns function which posts the given data and calls the
    // callback on response.
    function post(post_data, test_cb) {
        return function (done) {
            spyRes.events.once('responseComplete', function () {
                test_cb(done);
                if (test_cb.length === 0) { done(); }
            });
            put_item(post_data(), spyRes);
        };
    }

    describe('[detail]', function () {
        beforeEach(util.insertTestData);
        afterEach(util.deleteTestData);
        afterEach(util.resetSpies);
        afterEach(util.clearListner);

        it('should set read=true on the item when PUT data contains read=true', post(
            function () { return {user: {_id: 'FOO_UID'}, body: {read: true}, params: {ObjectID: test_data.item[0]._id}}; },
            function (done) {
                expect(spyRes.json.calls.argsFor(0)[0].read).toEqual(true);
                mongoConn.connection.call('collection', 'posts')
                .call('findOneAsync', {_id: test_data.item[0]._id})
                .then(function (item) {
                    expect(item.read).toBe(true);
                })
                .done(done);
            }
        ));
        it('should set read=false on the item when PUT data contains read=false', post(
            function () { return {user: {_id: 'FOO_UID'}, body: {read: false}, params: {ObjectID: test_data.item[0]._id}}; },
            function (done) {
                expect(spyRes.json.calls.argsFor(0)[0].read).toEqual(false);
                mongoConn.connection.call('collection', 'posts')
                .call('findOneAsync', {_id: test_data.item[0]._id})
                .then(function (item) {
                    expect(item.read).toBe(false);
                })
                .done(done);
            }
        ));
        it('should return 404 error if item cannot be found', post(
            function () { return {user: {_id: 'FOO_UID'}, body: {}, params: {item_id: 'aaaaaaaaaaaaaaaaaaaaaaaa'}}; },
            function () { expect(spyRes.status.calls.allArgs()).toEqual([[404]]); }
        ));
        it('should return 404 error if item_id does not make a good ObjectID', post(
            function () { return {user: {_id: 'FOO_UID'}, body: {}, params: {item_id: 'fooo*'}}; },
            function () { expect(spyRes.status.calls.allArgs()).toEqual([[404]]); }
        ));
    });


});
