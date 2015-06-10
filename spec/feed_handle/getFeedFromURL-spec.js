var feed_server = require('./test_atomserv/feed_server'),
    getFeedFromURL = require('../../webserv/feed_handle/utils/getFeedFromURL.js'),
    Promise = require('bluebird');

    
describe('getFeedFromURL', function () {
    beforeAll(function () {
        feed_server.startServer();
    });
    afterAll(function () {
        feed_server.stopServer();
    });

    it('should get the atom data from the test atom server', function (done){
        getFeedFromURL.parseFeed(getFeedFromURL.makeRequest('http://127.0.0.1:1337/surf.atom'))
        .then(function (data) {
            expect(data.meta.title).toEqual('A Board, Some Wax and a Leash');
            expect(data.items).toContain(jasmine.objectContaining({title: 'Life vs Surfing'}));
            expect(data.items.length).toEqual(25);
        })
        .done(done);
    });

    it('should should be able to follow alternate links in a webpage', function (done) {
        getFeedFromURL.get('http://127.0.0.1:1337/not_a_feed.html', true)
        .then(function (data) {
            expect(data.meta.title).toEqual('A Board, Some Wax and a Leash');
            expect(data.items).toContain(jasmine.objectContaining({title: 'Life vs Surfing'}));
            expect(data.items.length).toEqual(25);
        })
        .done(done);  
    });

    it('should reject promise if url doesn\'t work', function (done) {
        Promise.settle([getFeedFromURL.get('http://127.0.0.1:1337/cant_be_found.xml')])
        .then(function (results) {
            expect(results[0].isRejected()).toBe(true);
            expect(results[0].reason().message).toEqual('Not a feed');
            done();
        });
    });
});

