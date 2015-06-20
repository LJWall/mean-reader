var rewire = require('rewire'),
    api_views_maker = rewire('../webserv/api_views'),
    Promise = require('bluebird'),
    ObjectID = require('mongodb').ObjectID,
    events = require('events'),
    test_data = require('./api_views_test_data.json'),
    mongoConn = require('../webserv/mongoConnect.js'),
    feed_server = require('./feed_handle/test_atomserv/feed_server'),
    i, mockUrlFor;


function prepTestData () {
    for (i=0; i<test_data.meta.length; i++) {
        test_data.meta[i].last_update = new Date(test_data.meta[i].last_update);
    }
    for (i=0; i<test_data.item.length; i++) {
        test_data.item[i].last_update = new Date(test_data.item[i].last_update);
        test_data.item[i].pubdate = new Date(test_data.item[i].pubdate);
    }
}

function insertTestData (done) {
    var conn = mongoConn.connection(),
        insert_res = conn.call('collection', 'feeds').call('insertManyAsync', test_data.meta);

    var p1 = Promise.each(insert_res.get('ops'), function (meta, i) {
        test_data.meta[i]._id = test_data.item[i].meta_id = meta._id;
    });

    var p2 = p1.then(function () {
        return conn.call('collection', 'posts').call('insertManyAsync', test_data.item);
    });

    Promise.each(p2.get('ops'), function (item, i) {
        test_data.item[i]._id = item._id;
    })
    .done(done);
}
function deleteTestData (done) {
    var conn = mongoConn.connection();
    Promise.join(
        conn.call('collection', 'feeds').call('deleteManyAsync', {}),
        conn.call('collection', 'posts').call('deleteManyAsync', {})
    )
    .done(done);
}


describe('api_views modulue', function () {
    it('should export a function taking one paramter', function () {
        expect(typeof api_views_maker).toEqual('function');
        expect(api_views_maker.length).toEqual(1);
    });
});

describe('api_views object', function () {
    var api_views, spyRes, mockFeedModel, saveSpy,
        meta, item, meta_res, item_res;

    beforeAll(prepTestData);
    beforeAll(feed_server.startServer);
    afterAll(feed_server.stopServer);

    function resetSpies() {
        spyRes.json.calls.reset();
        spyRes.status.calls.reset();
        spyRes.set.calls.reset();
    }

    function clearListner() {
        spyRes.events.removeAllListeners();
    }

    beforeAll(function () {
        mockUrlFor = {
            feed: function (id) {return '/feeds/'+id;},
            item: function (id) {return '/items/'+id;},
        };

        api_views = api_views_maker(mockUrlFor);

        spyRes = jasmine.createSpyObj('res', ['json', 'status', 'end', 'set']);
        spyRes.status.and.returnValue(spyRes);
        spyRes.set.and.returnValue(spyRes);
        spyRes.events = new events.EventEmitter();
        spyRes.json.and.callFake(function () {
            setTimeout(spyRes.events.emit.bind(spyRes.events, 'responseComplete'), 0);
            return spyRes;
        });
        spyRes.end.and.callFake(function () {
            setTimeout(spyRes.events.emit.bind(spyRes.events, 'responseComplete'), 0);
            return spyRes;
        });
    });

    describe('getAll method', function () {
        beforeAll(insertTestData);
        afterAll(deleteTestData);
        beforeAll(function (done) {
            spyRes.events.once('responseComplete', done);
            api_views.getAll({user: {_id: 'FOO_UID'}, query: {}}, spyRes);
        });
        afterAll(resetSpies);
        afterAll(clearListner);

        it('should take two paramters', function () {
            expect(api_views.getAll.length).toEqual(2);
        });
        it('should return return a 200 code.', function () {
            expect(spyRes.status.calls.allArgs()).toEqual([[200]]);
        });
        it('should return data (for the authenticated user) using res.json()', function () {
            expect(spyRes.json.calls.count()).toEqual(1);
            var data = spyRes.json.calls.argsFor(0)[0];
            expect(data.meta.length).toEqual(1);
            expect(data.meta[0]).toEqual({
                feedurl: test_data.meta[0].feedurl,
                title: test_data.meta[0].title,
                description: test_data.meta[0].description,
                apiurl: mockUrlFor.feed(test_data.meta[0]._id)
            });
            expect(data.items.length).toEqual(1);
            expect(data.items[0]).toEqual({
                apiurl: mockUrlFor.item(test_data.item[0]._id),
                meta_apiurl:  mockUrlFor.feed(test_data.item[0].meta_id),
                link: test_data.item[0].link,
                title: test_data.item[0].title,
                pubdate: test_data.item[0].pubdate,
                read: false
            });
        });
        it('should set a last-modified header', function () {
            expect(spyRes.set.calls.argsFor(0)).toEqual(['last-modified', new Date('2000-01-01 13:00')]);
        });
    });

    describe('getAll method with updated_since query paramter', function () {
        beforeAll(insertTestData);
        afterAll(deleteTestData);
        beforeAll(function (done) {
            this.updated_since =  new Date('2000-01-01 12:30');
            spyRes.events.once('responseComplete', done);
            api_views.getAll({user: {_id: 'FOO_UID'}, query: {updated_since: this.updated_since}}, spyRes);
        });
        afterAll(resetSpies);
        afterAll(clearListner);
        it('should only return newly updated data', function () {
            var data = spyRes.json.calls.argsFor(0)[0];
            expect(data.meta.length).toEqual(0);
            expect(data.items.length).toEqual(1);
        });
    });

    describe('putPost method', function () {
        it('should take two parameters', function () {
            expect(api_views.putPost.length).toEqual(2);
        });

        describe('[usual request process]', function () {
            beforeAll(insertTestData);
            afterAll(deleteTestData);
            beforeAll(function (done) {
                spyRes.events.once('responseComplete', done);
                api_views.putPost({user: {_id: 'FOO_UID'}, body: {}, params: {item_id: test_data.item[0]._id.toHexString()}}, spyRes);
            });
            afterAll(resetSpies);
            afterAll(clearListner);

            it('should return a 200 code', function () {
                expect(spyRes.status.calls.allArgs()).toEqual([[200]]);
            });
            it('should return the item data', function () {
                expect(spyRes.json.calls.count()).toEqual(1);
                expect(spyRes.json.calls.argsFor(0)[0]).toEqual({
                    apiurl: mockUrlFor.item(test_data.item[0]._id),
                    meta_apiurl:  mockUrlFor.feed(test_data.item[0].meta_id),
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
                api_views.putPost(post_data(), spyRes);
            };
        }

        describe('[detail]', function () {
            beforeEach(insertTestData);
            afterEach(deleteTestData);
            afterEach(resetSpies);
            afterEach(clearListner);

            it('should set read=true on the item when PUT data contains read=true', post(
                function () { return {user: {_id: 'FOO_UID'}, body: {read: true}, params: {item_id: test_data.item[0]._id.toHexString()}}; },
                function (done) {
                    expect(spyRes.json.calls.argsFor(0)[0].read).toEqual(true);
                    mongoConn.connection().call('collection', 'posts')
                    .call('findOneAsync', {_id: test_data.item[0]._id})
                    .then(function (item) {
                        expect(item.read).toBe(true);
                    })
                    .done(done);
                }
            ));
            it('should set read=false on the item when PUT data contains read=false', post(
                function () { return {user: {_id: 'FOO_UID'}, body: {read: false}, params: {item_id: test_data.item[0]._id.toHexString()}}; },
                function (done) {
                    expect(spyRes.json.calls.argsFor(0)[0].read).toEqual(false);
                    mongoConn.connection().call('collection', 'posts')
                    .call('findOneAsync', {_id: test_data.item[0]._id})
                    .then(function (item) {
                        expect(item.read).toBe(false);
                    })
                    .done(done);
                }
            ));
            it('should return 500 error if no item_id on req.params', post(
                function () { return {user: {_id: 'FOO_UID'}, body: {}, params: {}}; },
                function () { expect(spyRes.status.calls.allArgs()).toEqual([[500]]); }
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

    describe('postAdd method (with good request)', function () {
        afterAll(deleteTestData);
        beforeAll(function (done) {
            spyRes.events.once('responseComplete', done);
            api_views.postAdd({user: {_id: 'FOOBAR'}, body: {feedurl: 'http://127.0.0.1:1337/short.atom'}}, spyRes);
        });
        afterAll(resetSpies);
        afterAll(clearListner);

        it('should take two paramters', function () {
            expect(api_views.postAdd.length).toEqual(2);
        });
        it('should return the data (using res.json())', function () {
            expect(spyRes.json.calls.count()).toEqual(1);
            var data = spyRes.json.calls.argsFor(0)[0];
            expect(data.meta[0].title).toEqual('Example Feed');
            expect(data.items.length).toEqual(1);
            expect(data.items[0].title).toEqual('Atom-Powered Robots Run Amok');
        });
        it('should return return a 201 code.', function () {
            expect(spyRes.status.calls.allArgs()).toEqual([[201]]);
        });
        it('should included a Location header field', function () {
            pending('not yet done...');
        });
    });

    describe('postAdd method (with bad request)', function () {
        beforeAll(function (done) {
            spyRes.events.once('responseComplete', done);   
            api_views.postAdd({user: {_id: 'FOOBAR'}, body: {bad: 'data'}}, spyRes);
        });
        afterAll(resetSpies);
        afterAll(clearListner);
        it('should return return a 400 code.', function () {
            expect(spyRes.status.calls.allArgs()).toEqual([[400]]);
        });
    });

    describe('postAdd method (with with feed add routine rejecting promise)', function () {
        beforeAll(function (done) {
            spyRes.events.once('responseComplete', function () {
                done();
            });
            api_views.postAdd({user: {_id: 'FOOBAR'}, body: {feedurl: 'http://127.0.0.1:9999/blah'}}, spyRes);
        });
        afterAll(resetSpies);
        afterAll(clearListner);
        it('should return return a 500 code.', function () {
            expect(spyRes.status.calls.allArgs()).toEqual([[500]]);
        });
    });

    describe('404 method', function () {
        beforeAll(function (done) {
            spyRes.events.once('responseComplete', done);   
            api_views['404']({}, spyRes);
        });
        afterAll(resetSpies);
        afterAll(clearListner);
        it('should return return a 404 code.', function () {
            expect(spyRes.status.calls.allArgs()).toEqual([[404]]);
        });
    });
});

