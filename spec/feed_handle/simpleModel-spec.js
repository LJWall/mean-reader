var model = require('../../webserv/feed_handle/utils/simpleModel'),
    Promise = require('bluebird');

describe('simpleModel', function () {
    var foo;
    
    beforeAll(function () {
        foo = {
            findOneAsync: jasmine.createSpy('findOneAsync').and.callFake(function () {
                return Promise.resolve({_id: 123, foo: 'bar'});
            }),
            updateOneAsync: jasmine.createSpy('updateOneAsync').and.returnValue('Spam')
        };
    });
    beforeEach(function () {
        foo.findOneAsync.calls.reset();
        foo.updateOneAsync.calls.reset();
    });
    
    it('should export a function', function () {
        expect(typeof model).toEqual('function');
    });
    it('should should acccept on paramter', function () {
        expect(model.length).toEqual(1);
    });
    it('should should return an object', function () {
        expect(typeof model(foo)).toEqual('object');
    });
    it('should should return an object with a find method, which takes two parameters', function () {
        expect(typeof model(foo).find).toEqual('function');
        expect(model(foo).find.length).toEqual(2);
    });
    describe('.find()', function () {
        it('should call collection.findOneAsync once with passed parameters', function () {
            var collection = model(foo);
            collection.find({spam: 'eggs'}, {skip: 42});
            expect(foo.findOneAsync.calls.count()).toEqual(1);
            expect(foo.findOneAsync).toHaveBeenCalledWith({spam: 'eggs'}, {skip: 42});
        });
        it('should return (promise for) object containing result from finOneAsync', function (done) {
            var collection = model(foo),
                result = collection.find({}, {});
            result.then(function (r) {
                expect(r).toEqual(jasmine.objectContaining({foo: 'bar'}));
            })
            .done(done);
        });
        it('should return (promise for) object containing a save method (which takes no parameters)', function (done) {
            var collection = model(foo),
                result = collection.find({}, {});
            result.then(function (r) {
                expect(typeof r.save).toEqual('function');
                expect(r.save.length).toEqual(0);
            })
            .done(done);
        });
        it('return object\'s _id protery should not be writtable', function (done) {
            var collection = model(foo),
                result = collection.find({}, {});
            result.then(function (r) {
                r._id = 'Some other thing';
                expect(r._id).toEqual(123);
            })
            .done(done);
        });
    });
    
    describe('.save()', function (done) {
        it('should use call updateOneAsync to save object', function (done) {
            var collection = model(foo),
                result = collection.find({}, {});
            
            result.then(function (r) {
                r.foo = 'manchu';
                r.bar = 'snacks';
                var save_res = r.save();
                expect(foo.updateOneAsync.calls.count()).toEqual(1);
                expect(foo.updateOneAsync).toHaveBeenCalledWith({_id: 123}, {$set: {foo: 'manchu', bar: 'snacks'}});
                expect(save_res).toEqual('Spam');
            })
            .done(done);
        });
        
    });
    
});