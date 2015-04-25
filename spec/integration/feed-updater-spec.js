var feed_server = require('./test_atomserv/feed_server'),
    feed_updater = require('../../webserv/feed-updater.js'),
    q = require('q');

var clearDB = function (db) {
    return q.all([
        q.npost(db.collection('posts'), 'deleteMany', [{}]),
        q.npost(db.collection('feeds'), 'deleteMany', [{}])
    ]);
};
    
describe('feed-updater', function () {
    var mongodb;
    
    beforeAll(function (done) {
        var MongoClient = require('mongodb').MongoClient;    
        feed_server.startServer();
        MongoClient.connect('mongodb://127.0.0.1:27017/testwomble', function(err, db) {
            mongodb = db;
            clearDB(mongodb).done(done);
        });
    });
    afterEach(function (done) {
        clearDB(mongodb).done(done);
    });
    afterAll(function () {
        mongodb.close();
    });
    
    it('getFeedData should get the atom data from the test atom server', function (done){
        feed_updater.getFeedData('http://127.0.0.1:1337/surf.atom', mongodb).then(function (data) {
            expect(data.meta.title).toEqual('A Board, Some Wax and a Leash');
            expect(data.items).toContain(jasmine.objectContaining({title: 'Life vs Surfing'}));
        }).done(setTimeout.bind(null, done, 0));  
    });
    
    
});