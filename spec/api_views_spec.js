var rewire = require('rewire'),
    api_views_maker = rewire('../webserv/api_views'),
    Promise = require('bluebird'),
    ObjectID = require('mongodb').ObjectID,
    events = require('events');

/* ------ Test data ------ */
var meta = [{_id: new ObjectID(), feedurl: 'url1', title: 'Blog1', description: 'Interesting', surplus_data: 'junk'},
            {_id: new ObjectID(), feedurl: 'url2', title: 'Blog2', link: 'link2', surplus_data: 'junk'}],
    item = [{_id: new ObjectID(), meta_id: meta[0]._id, link: 'itemlink1', title: 'Foo', surplus_data: 'junk'},
            {_id: new ObjectID(), meta_id: meta[1]._id, link: 'itemlink2', title: 'Bar', surplus_data: 'junk'}],
    meta_res = [{apiurl: '/feeds/' + meta[0]._id.toString(), feedurl: 'url1', title: 'Blog1', description: 'Interesting'},
                {apiurl: '/feeds/' + meta[1]._id.toString(), feedurl: 'url2', title: 'Blog2', link: 'link2'}],
    item_res = [{apiurl: '/items/' + item[0]._id.toString(), meta_apiurl: '/feeds/' + meta[0]._id.toString(), link: 'itemlink1', title: 'Foo'},
                {apiurl: '/items/' + item[1]._id.toString(), meta_apiurl: '/feeds/' + meta[1]._id.toString(), link: 'itemlink2', title: 'Bar'}];
    
/* ----------------------- */


describe('api_views modulue', function () {
    it('should export a function taking one paramter', function () {
        expect(typeof api_views_maker).toEqual('function');
        expect(api_views_maker.length).toEqual(1);
    });
});

describe('api_views object', function () {
    var api_views,
        spyRes;
    
    beforeAll(function () {
        var mockFeedModel = {
            feeds: {
                findOne: function () {return Promise.resolve(meta[0])},
                findMany: function () {return Promise.resolve(meta)}
            },
            posts: {
                findOne: function () {return Promise.resolve(item[0])},
                findMany: function () {return Promise.resolve(item)}
            }
        };
        var mockUrlFor = {
            feed: function (id) {return '/feeds/'+id},
            item: function (id) {return '/items/'+id},
        };
        
        api_views_maker.__set__('feedModelMaker', function () { return mockFeedModel; });
        api_views = api_views_maker(mockUrlFor);
        
        spyRes = jasmine.createSpyObj('res', ['json', 'status']);
        spyRes.status.and.returnValue(spyRes);
        spyRes.events = new events.EventEmitter();
        spyRes.json.and.callFake(function () {
            spyRes.events.emit('jsonCalled');
            return spyRes;
        });
        
    });
    beforeEach(function () {
        spyRes.json.calls.reset();
        spyRes.status.calls.reset();
    });
    
    describe('getAll method', function () {
        it('should exist', function () {
            expect(typeof api_views.getAll).toEqual('function');
        });
        it('should take two paramters', function () {
            expect(api_views.getAll.length).toEqual(2);
        });
        it('should return all the data using res.json().', function (done) {
            api_views.getAll({}, spyRes)
            spyRes.events.once('jsonCalled', function () {
                expect(spyRes.status.calls.allArgs()).toEqual([[200]]);
                expect(spyRes.json.calls.allArgs()).toEqual([[{meta: meta_res, items: item_res}]]);
                done()
            });
        });
    });
});

