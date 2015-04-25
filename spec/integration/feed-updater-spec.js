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
    var mongodb,
        sampledata1 = {
            meta: {url: 'url', xmlurl: 'xmlurl', title: 'blog'},
            items: [{xmlurl: 'xmlurl', guid: '1', title: 'T1'}, {xmlurl: 'xmlurl', guid: '2', title: 'T2'}]
        };
    
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
                expect(data.items.length).toEqual(25);
            }).done(done);  
        });
    });
    
    describe('updateFeedData', function () {    
        it('should put the feed data in the DB', function (done){
            feed_updater.updateFeedData(sampledata1, mongodb)
            .then(function (insert_res) {
                return Promise.all([
                    mongodb.collection('feeds').find({}).toArrayAsync(),
                    mongodb.collection('posts').find({}).toArrayAsync()
                ]);
            }).then(function (db_data) {
                expect(db_data[0].length).toEqual(1);
                expect(db_data[0][0].title).toEqual('blog');
                expect(db_data[1].length).toEqual(2);
                expect(db_data[1]).toContain(jasmine.objectContaining({guid: '1', title: 'T1'}));
                expect(db_data[1]).toContain(jasmine.objectContaining({guid: '2', title: 'T2'}));
            })
            .done(done);
        });
        
        it('should not double insert exiting data', function (done){
            var sampledata2 = {
                    meta: {url: 'url', xmlurl: 'xmlurl', title: 'New title'},
                    items: [{xmlurl: 'xmlurl', guid: '2', title: 'NewT2'}, {xmlurl: 'xmlurl', guid: '3', title: 'T3'}]
                };
            feed_updater.updateFeedData(sampledata1, mongodb)
            .then(function (insert_res) {
                return feed_updater.updateFeedData(sampledata2, mongodb)
            })
            .then(function (insert_res) {
                return Promise.all([
                    mongodb.collection('feeds').find({}).toArrayAsync(),
                    mongodb.collection('posts').find({}).toArrayAsync()
                ]);
            }).then(function (db_data) {
                expect(db_data[0].length).toEqual(1);
                expect(db_data[0][0].title).toEqual('New title');
                expect(db_data[1].length).toEqual(3);
                expect(db_data[1]).toContain(jasmine.objectContaining({guid: '1', title: 'T1'}));
                expect(db_data[1]).toContain(jasmine.objectContaining({guid: '2', title: 'NewT2'}));
                expect(db_data[1]).toContain(jasmine.objectContaining({guid: '3', title: 'T3'}));
            })
            .done(done);
        });
    });

    describe('getFeedData', function () {    
        it('should get the feed data in the DB', function (done){
            feed_updater.updateFeedData(sampledata1, mongodb)
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