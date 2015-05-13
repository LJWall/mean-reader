var mongoFeedStore = require('../../webserv/feed_handle/utils/mongoFeedStore.js'),
    Promise = require('bluebird'),
    mongoConn = require('../../webserv/mongoConnect.js'),
    ObjectID = require('mongodb').ObjectID;

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
            meta: {_id: new ObjectID('000000000000000000000001'), link: 'url', feedurl: 'feedurl', title: 'blog'},
            items: [{feedurl: 'feedurl', guid: '1', title: 'T1', }, {feedurl: 'feedurl', guid: '2', title: 'T2'}]
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
    afterAll(function () {
        mongodb.close();
    });

    
    describe('updateMongoFeedData', function () {
        afterEach(function (done) {
            clearDB(mongodb).done(done);
        });
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
                items: [{guid: '2', title: 'NewT2'}, {guid: '3', title: 'T3'}]
            };
            sampledata1.items[0].meta_id = sampledata1.meta._id;
            sampledata1.items[1].meta_id = sampledata1.meta._id;
            Promise.all([
                mongodb.collection('feeds').insertOneAsync(sampledata1.meta),
                mongodb.collection('posts').insertManyAsync(sampledata1.items)
            ])
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
    
    describe('[db get routines]', function () {
        var sampledata2 = {
            meta: {_id: new ObjectID('000000000000000000000002'), link: 'url2', feedurl: 'feedurl2', title: 'blog2'},
            items: [{feedurl: 'feedurl2', guid: '1', title: 'S1'}, {feedurl: 'feedurl2', guid: '2', title: 'S2'}]
        };
        sampledata2.items[0].meta_id = sampledata2.meta._id;
        sampledata2.items[1].meta_id = sampledata2.meta._id;
        
        beforeAll(function (done) {
            Promise.all([
                mongodb.collection('feeds').insertOneAsync(sampledata1.meta),
                mongodb.collection('posts').insertManyAsync(sampledata1.items),
                mongodb.collection('feeds').insertOneAsync(sampledata2.meta),
                mongodb.collection('posts').insertManyAsync(sampledata2.items)
            ])
            .done(done);
        });
        afterAll(function (done) {
            clearDB(mongodb).done(done);
        });
        
        describe('getMongoFeedItems', function () {
            it('should get the feed items from the DB when called with a url', function (done){
                mongoFeedStore.getMongoFeedItems('feedurl')
                .then(function (data) {
                    expect(data.length).toEqual(2);
                    expect(data).toEqual(jasmine.arrayContaining([jasmine.objectContaining(sampledata1.items[0])]));
                    expect(data).toEqual(jasmine.arrayContaining([jasmine.objectContaining(sampledata1.items[1])]));
                })
                .done(done);
            });
            it('should get the feed items for all feeds from the DB when called without a paramter', function (done){
                mongoFeedStore.getMongoFeedItems()
                .then(function (data) {
                    expect(data.length).toEqual(4);
                    expect(data).toEqual(jasmine.arrayContaining([jasmine.objectContaining(sampledata1.items[0])]));
                    expect(data).toEqual(jasmine.arrayContaining([jasmine.objectContaining(sampledata1.items[1])]));
                    expect(data).toEqual(jasmine.arrayContaining([jasmine.objectContaining(sampledata2.items[0])]));
                    expect(data).toEqual(jasmine.arrayContaining([jasmine.objectContaining(sampledata2.items[1])]));
                })
                .done(done);
            });
        });
        
        describe('getMongoFeedItemsByID', function () {
            it('should get the feed items from the DB when called with a meta_id', function (done) {
                mongoFeedStore.getMongoFeedItemsByID('000000000000000000000002')
                .then(function (data) {
                    expect(data.length).toEqual(2);
                    expect(data).toEqual(jasmine.arrayContaining([jasmine.objectContaining(sampledata2.items[0])]));
                    expect(data).toEqual(jasmine.arrayContaining([jasmine.objectContaining(sampledata2.items[1])]));
                })
                .done(done);
            });
        });
        
        describe('getMongoFeedMeta', function () {    
            it('should get the feed meta from the DB when called with a url', function (done){
                mongoFeedStore.getMongoFeedMeta('feedurl')
                .then(function (data) {
                    expect(data).toEqual(jasmine.objectContaining(sampledata1.meta));
                })
                .done(done);
            });
            it('should get meta for all feeds from the DB when called without a paramter', function (done){
                mongoFeedStore.getMongoFeedMeta()
                .then(function (data) {
                    expect(data.length).toEqual(2);
                    expect(data).toEqual(jasmine.arrayContaining([jasmine.objectContaining(sampledata1.meta)]));
                    expect(data).toEqual(jasmine.arrayContaining([jasmine.objectContaining(sampledata2.meta)]));
                })
                .done(done);
            });
        });
        
        describe('setRead', function () {
            it('should mark an item as read', function (done) {
                return mongoFeedStore.setRead('000000000000000000000002', '2')
                .then(function () {
                    return Promise.all([
                        mongodb.collection('posts').findOneAsync({feedurl: 'feedurl2', guid: '1'}),
                        mongodb.collection('posts').findOneAsync({feedurl: 'feedurl2', guid: '2'})
                    ]);
                })
                .then(function (db_data) {
                    expect(db_data.length).toEqual(2);
                    expect(db_data[0]).toEqual(jasmine.objectContaining({guid: '1', title: 'S1'}));
                    expect(db_data[0]).not.toEqual(jasmine.objectContaining({read: true}));
                    expect(db_data[1]).toEqual(jasmine.objectContaining({guid: '2', title: 'S2', read: true}));
                })
                .done(done);
            });
        });
        
    });
        
});
