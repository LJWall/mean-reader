var mongoFeedStore = require('../../webserv/feed_handle/utils/mongoFeedStore.js'),
    Promise = require('bluebird'),
    mongoConn = require('../../webserv/mongoConnect.js');

Promise.longStackTraces();


var clearDB = function (db) {
    return Promise.all([
        db.collection('posts').deleteManyAsync({}),
        db.collection('feeds').deleteManyAsync({})
    ]);
};
    
describe('mongoFeedStore', function () {
    var mongodb,
        sampledata1 = {
            meta: {link: 'url', feedurl: 'feedurl', title: 'blog'},
            items: [{feedurl: 'feedurl', guid: '1', title: 'T1'}, {feedurl: 'feedurl', guid: '2', title: 'T2'}]
        };
    
    beforeAll(function (done) {
        mongoConn.uri = 'mongodb://127.0.0.1:27017/testwomble';
        mongoConn.connection()
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
    
    describe('updateMongoFeedData', function () {    
        it('should put the feed data in the DB', function (done){
            mongoFeedStore.updateMongoFeedData(sampledata1)
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
                    meta: {link: 'url', feedurl: 'feedurl', title: 'New title'},
                    items: [{feedurl: 'feedurl', guid: '2', title: 'NewT2'}, {feedurl: 'feedurl', guid: '3', title: 'T3'}]
                };
            mongoFeedStore.updateMongoFeedData(sampledata1)
            .then(function (insert_res) {
                return mongoFeedStore.updateMongoFeedData(sampledata2)
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

    describe('getMongoFeedData', function () {    
        it('should pass its work to getMongoFeedMeta and getMongoFeedItems', function (done){
            spyOn(mongoFeedStore, 'getMongoFeedMeta').and.returnValue(Promise.resolve('Foo!'));
            spyOn(mongoFeedStore, 'getMongoFeedItems').and.returnValue(Promise.resolve('Bar!'));
            
            mongoFeedStore.getMongoFeedData('feedurl')
            .then(function (data) {
                expect(mongoFeedStore.getMongoFeedMeta.calls.count()).toEqual(1);
                expect(mongoFeedStore.getMongoFeedItems.calls.count()).toEqual(1);
                expect(data.meta).toEqual('Foo!');
                expect(data.items).toEqual('Bar!');
            })
            .done(done);
        });
        
        it('should do something sensible when there\'s no data', function (done) {
            mongoFeedStore.getMongoFeedData('feedurl')
            .then(function (data) {
                expect(data).toEqual({meta: null, items: []});
            })
            .done(done);
        });
    });
    
    describe('getMongoFeedItems', function () {    
        it('should get the feed items from the DB', function (done){
            mongoFeedStore.updateMongoFeedData(sampledata1) // should not really rely on updateMongoFeedData here!
            .then(function (insert_res) {
                return mongoFeedStore.getMongoFeedItems('feedurl');
            })
            .then(function (data) {
                expect(data.length).toEqual(2);
                expect(data).toContain(jasmine.objectContaining({feedurl: 'feedurl', title: 'T2'}));
            })
            .done(done);
        });
    });
    
    describe('getMongoFeedMeta', function () {    
        it('should get the feed meta from the DB', function (done){
            mongoFeedStore.updateMongoFeedData(sampledata1) // should not really rely on updateMongoFeedData here!
            .then(function (insert_res) {
                return mongoFeedStore.getMongoFeedMeta('feedurl');
            })
            .then(function (data) {
                expect(data.title).toEqual('blog');
            })
            .done(done);
        });
    });
    
        
});
