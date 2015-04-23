var feed_server = require('./test_atomserv/feed_server');
var feed_updater = require('../../webserv/feed-updater.js');

describe('feed-updater', function () {
    var mongodb;
    
    beforeAll(function (done) {
        var MongoClient = require('mongodb').MongoClient;    
        feed_server.startServer();
        MongoClient.connect('mongodb://127.0.0.1:27017/testwomble', function(err, db) {
            mongodb = db;
            done();
        });
    });
    afterAll(function () {
        mongodb.close();
    });
    
    it('getFeedData should get the atom data from the test atom server', function (done){
        feed_updater.getFeedData('http://127.0.0.1:1337/surf.atom', mongodb).then(function (data) {
            expect(data.meta.title).toEqual('A Board, Some Wax and a Leash');
            expect(data.items).toContain(jasmine.objectContaining({title: 'Life vs Surfing'}));
        }).done(setTimeout.bind(null, done, 0), function (err) {console.log('Error:', e), done()});  
    });
    
    
});