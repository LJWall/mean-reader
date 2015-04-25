var feed_server = require('./test_atomserv/feed_server'),
    feed_updater = require('../../webserv/feed-updater.js'),
    Promise = require('bluebird'),
    mongodb = require("mongodb"),
    MongoClient = Promise.promisifyAll(mongodb.MongoClient);

Promise.promisifyAll(mongodb.Collection.prototype);
Promise.promisifyAll(mongodb.Cursor.prototype);

Promise.longStackTraces();


var clearDB = function (db) {
    return Promise.all([
        db.collection('posts').deleteManyAsync({}),
        db.collection('feeds').deleteManyAsync({})
    ]);
};
    
describe('feed-updater', function () {
    var mongodb;
    
    beforeAll(function (done) {
        feed_server.startServer();
        MongoClient.connectAsync('mongodb://127.0.0.1:27017/testwomble')
        .then(function(db) {
            mongodb = db;
            return db;
        })
        .then(clearDB)
        .done(done);
    });
    afterEach(function (done) {
        clearDB(mongodb).done(done);
    });
    afterAll(function () {
        mongodb.close();
    });
    
    describe('getFeedFromSource', function () {    
        it('should get the atom data from the test atom server', function (done){
            feed_updater.getFeedFromSource('http://127.0.0.1:1337/surf.atom').then(function (data) {
                expect(data.meta.title).toEqual('A Board, Some Wax and a Leash');
                expect(data.items).toContain(jasmine.objectContaining({title: 'Life vs Surfing'}));
            }).done(done);  
        });
    });
    
    describe('updateFeedData', function () {    
        it('should put the feed data in the DB', function (done){
            feed_updater.getFeedFromSource('http://127.0.0.1:1337/surf.atom')
            .then(function (feed_data) {
                return feed_updater.updateFeedData(feed_data, mongodb);
            })
            .then(function (insert_res) {
                expect(insert_res[0].ops[0].title).toEqual('A Board, Some Wax and a Leash');
                expect(insert_res[0].insertedCount).toEqual(1);
                expect(insert_res[1].ops).toContain(jasmine.objectContaining({title: 'Life vs Surfing'}));
                expect(insert_res[1].insertedCount).toEqual(25);
            })
            .done(done);
        });
    });

    describe('getFeedData', function () {    
        it('should get the feed data in the DB', function (done){
            // this part is tested elsewhere
            var sampledata = {
                meta: {url: 'url', xmlurl: 'xmlurl', title: 'blog'},
                items: [{xmlurl: 'xmlurl', title: 'T1'}, {xmlurl: 'xmlurl', title: 'T2'}]
            };
            feed_updater.updateFeedData(sampledata, mongodb)
            .then(function (insert_res) {
                return feed_updater.getFeedData('url', mongodb);
            })
            .then(function (data) {
                expect(data.meta.title).toEqual('blog');
                expect(data.items.length).toEqual(2);
                expect(data.items).toContain(jasmine.objectContaining({xmlurl: 'xmlurl', title: 'T2'}));
            })
            .done(done);
        });
    });    
    
});