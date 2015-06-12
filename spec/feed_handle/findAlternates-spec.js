var feed_server = require('./test_atomserv/feed_server'),
    findAlternates = require('../../webserv/feed_handle/utils/findAlternates.js'),
    Promise = require('bluebird'),
    request = require('request');

    
describe('getFeedFromURL', function () {
    beforeAll(function () {
        feed_server.startServer();
    });
    afterAll(function () {
        feed_server.stopServer();
    });

    it('should find the alternate links in a webpage', function (done) {
        var req = request('http://127.0.0.1:1337/not_a_feed.html'),
            fa = findAlternates();
        req.pipe(fa.stream);
        fa.result.then(function (alts) {
            expect(alts).toEqual([
                'http://127.0.0.1:1337/404.xml',
                'http://127.0.0.1:1337/404.rss',
                'http://127.0.0.1:1337/404.atom',
                'http://127.0.0.1:1337/surf.atom'
            ]);
        })
        .done(done);  
    });

});

