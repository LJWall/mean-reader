var modelMaker = require('../../webserv/feed_handle/utils/simpleModel'),
    Promise = require('bluebird');

describe('simpleModel', function () {
    var foo, cursor = {};
    
    beforeAll(function () {
        cursor.toArrayAsync = jasmine.createSpy('toArrayAsync').and.callFake(function () {
            return Promise.resolve([{_id: 1, foo:'a'}]);
        });
        cursor.limit = jasmine.createSpy('limit').and.returnValue(cursor);
        cursor.sort = jasmine.createSpy('sort').and.returnValue(cursor);
        foo = {
            findOneAsync: jasmine.createSpy('findOneAsync').and.callFake(function () {
                return Promise.resolve({_id: 123, foo: 'bar'});
            }),
            updateOneAsync: jasmine.createSpy('updateOneAsync').and.returnValue('Spam'),
            find: jasmine.createSpy('find').and.returnValue(cursor)
        };
    });
    beforeEach(function () {
        foo.findOneAsync.calls.reset();
        foo.updateOneAsync.calls.reset();
        foo.find.calls.reset();
        cursor.toArrayAsync.calls.reset();
        cursor.limit.calls.reset();
        cursor.sort.calls.reset();
    });
    
    it('should export a function', function () {
        expect(typeof modelMaker).toEqual('function');
    });
    it('should should acccept one paramter', function () {
        expect(modelMaker.length).toEqual(1);
    });
    it('should should return an object', function () {
        expect(typeof modelMaker(foo)).toEqual('object');
    });
    it('should should return an object with a findOne method, which takes one parameter', function () {
        expect(typeof modelMaker(foo).findOne).toEqual('function');
        expect(modelMaker(foo).findOne.length).toEqual(1);
    });
    
    it('should should return an object with a findMany method, which takes three parameters', function () {
        expect(typeof modelMaker(foo).findMany).toEqual('function');
        expect(modelMaker(foo).findMany.length).toEqual(3);
    });
    
    describe('.findOne()', function () {
        it('should call collection.findOneAsync once with passed parameters', function () {
            var collection = modelMaker(foo);
            collection.findOne({spam: 'eggs'});
            expect(foo.findOneAsync.calls.count()).toEqual(1);
            expect(foo.findOneAsync).toHaveBeenCalledWith({spam: 'eggs'});
        });
        it('should return (promise for) object containing result from findOneAsync', function (done) {
            var collection = modelMaker(foo),
                result = collection.findOne({}, {});
            result.then(function (r) {
                expect(r).toEqual(jasmine.objectContaining({foo: 'bar'}));
            })
            .done(done);
        });
        it('should return (promise for) object containing a save method (which takes no parameters)', function (done) {
            var collection = modelMaker(foo),
                result = collection.findOne({}, {});
            result.then(function (r) {
                expect(typeof r.save).toEqual('function');
                expect(r.save.length).toEqual(0);
            })
            .done(done);
        });
        it('return object\'s _id property should not be writtable', function (done) {
            var collection = modelMaker(foo),
                result = collection.findOne({}, {});
            result.then(function (r) {
                r._id = 'Some other thing';
                expect(r._id).toEqual(123);
            })
            .done(done);
        });
        
    });
    
    describe('.findMany()', function() {
        it('should call collection.find(q).toArrayAsync() if only passed a search query', function () {
            var collection = modelMaker(foo);
            collection.findMany({spam: 'eggs'});
            expect(foo.find.calls.count()).toEqual(1);
            expect(foo.find).toHaveBeenCalledWith({spam: 'eggs'});
            expect(cursor.toArrayAsync.calls.count()).toEqual(1);
            expect(cursor.sort.calls.count()).toEqual(0);
            expect(cursor.limit.calls.count()).toEqual(0);
        });
        
        it('should call collection.find(q).sort(s).toArrayAsync() if only passed a search query and sort term', function () {
            var collection = modelMaker(foo);
            collection.findMany({spam: 'eggs'}, [['foo', -1]]);
            expect(foo.find.calls.count()).toEqual(1);
            expect(foo.find).toHaveBeenCalledWith({spam: 'eggs'});
            expect(cursor.sort.calls.count()).toEqual(1);
            expect(cursor.sort).toHaveBeenCalledWith([['foo', -1]]);
            expect(cursor.toArrayAsync.calls.count()).toEqual(1);
            expect(cursor.limit.calls.count()).toEqual(0);
        });
        
        it('should call collection.find(q).limit(n).toArrayAsync() if only passed a search query and limit', function () {
            var collection = modelMaker(foo);
            collection.findMany({spam: 'eggs'}, null, 5);
            expect(foo.find.calls.count()).toEqual(1);
            expect(foo.find).toHaveBeenCalledWith({spam: 'eggs'});
            expect(cursor.limit.calls.count()).toEqual(1);
            expect(cursor.limit).toHaveBeenCalledWith(5);
            expect(cursor.toArrayAsync.calls.count()).toEqual(1);
            expect(cursor.sort.calls.count()).toEqual(0);
        });
        
        it('should return (promise for) object containing result from findOneAsync', function (done) {
            var collection = modelMaker(foo),
                result = collection.findMany({spam: 'eggs'});
            result.then(function (r) {
                expect(r[0]).toEqual(jasmine.objectContaining({_id: 1, foo: 'a'}));
            })
            .done(done);
        });
        it('should add a save method to array items (which takes no parameters)', function (done) {
            var collection = modelMaker(foo),
                result = collection.findMany({spam: 'eggs'});
            result.then(function (r) {
                expect(typeof r[0].save).toEqual('function');
                expect(r[0].save.length).toEqual(0);
            })
            .done(done);
        });
        it('should make _id property not be writtable for items in return array', function (done) {
            var collection = modelMaker(foo),
                result = collection.findMany({});
            result.then(function (r) {
                r[0]._id = 'Some other thing';
                expect(r[0]._id).toEqual(1);
            })
            .done(done);
        });
        
    });
    
    describe('.save()', function () {
        it('should call collection.updateOneAsync to update object on result of findOne()', function (done) {
            var collection = modelMaker(foo),
                result = collection.findOne({}, {});
            
            result.then(function (r) {
                r.foo = 'manchu';
                r.bar = 'snacks';
                expect(foo.updateOneAsync.calls.count()).toEqual(0); // to check it really gts called on save()
                var save_res = r.save();
                expect(foo.updateOneAsync.calls.count()).toEqual(1);
                expect(foo.updateOneAsync).toHaveBeenCalledWith({_id: 123}, {$set: {foo: 'manchu', bar: 'snacks'}});
                expect(save_res).toEqual('Spam');
            })
            .done(done);
        });
        
        it('should call collection.updateOneAsync to update object on result of findMany()[0]', function (done) {
            var collection = modelMaker(foo),
                result = collection.findMany({});
            
            result.then(function (r) {
                r[0].foo = 'manchu';
                r[0].bar = 'snacks';
                expect(foo.updateOneAsync.calls.count()).toEqual(0); // to check it really gts called on save()
                var save_res = r[0].save();
                expect(foo.updateOneAsync.calls.count()).toEqual(1);
                expect(foo.updateOneAsync).toHaveBeenCalledWith({_id: 1}, {$set: {foo: 'manchu', bar: 'snacks'}});
                expect(save_res).toEqual('Spam');
            })
            .done(done);
        });
        
    });
    
});