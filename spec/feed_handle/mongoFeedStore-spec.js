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
        mongoConn.connection()
        .then(function(db) {
            mongodb = db;
            return db;
        })
        .then(clearDB)
        .done(done);
    });

    
    describe('updateMongoFeedData', function () {
        afterEach(function (done) {
            clearDB(mongodb).done(done);
        });
        it('should put the feed data in the DB', function (done){
            mongoFeedStore.updateMongoFeedData(mongodb, sampledata1)
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
                return mongoFeedStore.updateMongoFeedData(mongodb, sampledata2);
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
});
