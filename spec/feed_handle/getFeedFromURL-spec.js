var feed_server = require('./test_atomserv/feed_server'),
    getFeedFromURL = require('../../webserv/feed_handle/utils/getFeedFromURL.js'),
    Promise = require('bluebird');

    
describe('getFeedFromURL', function () {
    beforeAll(feed_server.startServer);
    afterAll(feed_server.stopServer);

    it('should should be able to follow alternate links in a webpage', function (done) {
        getFeedFromURL('http://127.0.0.1:1337/not_a_feed.html', true)
        .then(function (data) {
            expect(data.meta.title).toEqual('A Board, Some Wax and a Leash');
            expect(data.items).toContain(jasmine.objectContaining({title: 'Life vs Surfing'}));
            expect(data.items.length).toEqual(25);
        })
        .done(done);
    });

    it('should reject promise if url nor alternates are feeds', function (done) {
        Promise.settle([getFeedFromURL('http://127.0.0.1:1337/bad_alternates.html')])
        .then(function (results) {
            expect(results[0].isRejected()).toBe(true);
            expect(results[0].reason().message).toEqual('Not a feed');
        })
        .done(done);
    });


    it('should reject promise if url doesn\'t give a feed and can\'t follow alternates', function (done) {
        Promise.settle([getFeedFromURL('http://127.0.0.1:1337/not_a_feed.html')])
        .then(function (results) {
            expect(results[0].isRejected()).toBe(true);
            expect(results[0].reason().message).toEqual('Not a feed');
        })
        .done(done);  
    });

   it('should reject promise if url returns 404', function (done) {
        Promise.settle([getFeedFromURL('http://127.0.0.1:1337/cant_be_found.xml')])
        .then(function (results) {
            expect(results[0].isRejected()).toBe(true);
            expect(results[0].reason().message).toEqual('Not a feed');
        })
        .done(done);
    });

    it('should reject promise on connections refused', function (done) {
        Promise.settle([getFeedFromURL('http://127.0.0.1:9999/will_be_refused.xml')])
        .then(function (results) {
            expect(results[0].isRejected()).toBe(true);
            expect(results[0].reason().message).toEqual('connect ECONNREFUSED');
        })
        .done(done);
    });

    it('should set the feed URL to the canonical URL specified by the feed, if given', function (done) {
        getFeedFromURL('http://127.0.0.1:1337/short.atom')
        .then(function (data) {
            expect(data.meta.feedurl).toEqual('http://example.org/feed/');
        })
        .done(done);
    });

    it('should set the feed URL to the reqest URL if no cannonical URL specified by the feed', function (done) {
        getFeedFromURL('http://127.0.0.1:1337/short2.atom')
        .then(function (data) {
            expect(data.meta.feedurl).toEqual('http://127.0.0.1:1337/short2.atom');
        })
        .done(done);
    });
});

