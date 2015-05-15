var modelMaker = require('../../webserv/feed_handle/utils/simpleModel'),
    mongoConn = require('../../webserv/mongoConnect.js');
    
describe('simpleModel [integration]', function () {
    var db,
        collection,
        model;
    
    beforeAll(function (done) {
        mongoConn.uri = 'mongodb://127.0.0.1:27017/testwomble';
        mongoConn.connection()
        .then(function(_db) {
            collection = _db.collection('simpleModelTest');
            db = _db;
            model = modelMaker(collection);
            return collection.deleteManyAsync({});
        })
        .done(done);
    });
    
    afterAll(function () { db.close(); });
    
    beforeEach(function (done) {
        collection.insertManyAsync([
            {_id: 100, foo: 1, bar: 'a'},
            {_id: 101, foo: 2, bar: 'b'},
            {_id: 102, foo: 3, bar: 'c'}
        ])
        .done(done);
    });
    afterEach(function (done) {
        collection.deleteManyAsync({})
        .done(done);
    });
    
    it('should get a result with .findOne() and save a change with .save()', function (done) {
        model.findOne({foo: 2})
        .then(function (result) {
            expect(result).toEqual(jasmine.objectContaining({foo: 2, bar: 'b'}));
            result.more = {hello: 'world'};
            return result.save();
        })
        .then(function () {
            return collection.find({}).toArrayAsync();
        })
        .then(function (result) {
            expect(result.length).toEqual(3);
            expect(result).toContain({_id: 100, foo: 1, bar: 'a'});
            expect(result).toContain({_id: 101, foo: 2, bar: 'b', more: {hello: 'world'}});
            expect(result).toContain({_id: 102, foo: 3, bar: 'c'});
        })
        .done(done);
    });
    it('should get results with .findMany() and save a change with .save()', function (done) {
        model.findMany({}, {foo: -1}, 2)
        .then(function (result) {
            expect(result.length).toEqual(2);
            expect(result[0]).toEqual(jasmine.objectContaining({foo: 3, bar: 'c'}));
            expect(result[1]).toEqual(jasmine.objectContaining({foo: 2, bar: 'b'}));
            result[0].more = {tea: 'time'};
            return result[0].save();
        })
        .then(function () {
            return collection.find({}).toArrayAsync();
        })
        .then(function (result) {
            expect(result.length).toEqual(3);
            expect(result).toContain({_id: 100, foo: 1, bar: 'a'});
            expect(result).toContain({_id: 101, foo: 2, bar: 'b'});
            expect(result).toContain({_id: 102, foo: 3, bar: 'c', more: {tea: 'time'}});
        })
        .done(done);
    });
    
});