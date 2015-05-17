var rewire = require('rewire'),
    api_views_maker = rewire('../webserv/api_views'),
    Promise = require('bluebird'),
    ObjectID = require('mongodb').ObjectID,
    events = require('events');

/* ------ Test data ------ */
var meta = [{_id: new ObjectID(), feedurl: 'url1', title: 'Blog1', description: 'Interesting', surplus_data: 'junk'},
            {_id: new ObjectID(), feedurl: 'url2', title: 'Blog2', link: 'link2', surplus_data: 'junk'}],
    item = [{_id: new ObjectID(), meta_id: meta[0]._id, link: 'itemlink1', title: 'Foo', surplus_data: 'junk', pubdate: '2015-01-01'},
            {_id: new ObjectID(), meta_id: meta[1]._id, link: 'itemlink2', title: 'Bar', surplus_data: 'junk', pubdate: '2015-01-02'}],
    meta_res = [{apiurl: '/feeds/' + meta[0]._id.toString(), feedurl: 'url1', title: 'Blog1', description: 'Interesting'},
                {apiurl: '/feeds/' + meta[1]._id.toString(), feedurl: 'url2', title: 'Blog2', link: 'link2'}],
    item_res = [{apiurl: '/items/' + item[0]._id.toString(), meta_apiurl: '/feeds/' + meta[0]._id.toString(), link: 'itemlink1', title: 'Foo', pubdate: '2015-01-01'},
                {apiurl: '/items/' + item[1]._id.toString(), meta_apiurl: '/feeds/' + meta[1]._id.toString(), link: 'itemlink2', title: 'Bar', pubdate: '2015-01-02'}];
    
/* ----------------------- */


describe('api_views modulue', function () {
    it('should export a function taking one paramter', function () {
        expect(typeof api_views_maker).toEqual('function');
        expect(api_views_maker.length).toEqual(1);
    });
    
    it('should use nice \'cleaning\' functions', function () {
        pending('should test the cleaning function, and the one using reduce to fileter out errors.');
    });
});

describe('api_views object', function () {
    var api_views,
        spyRes,
        mockFeedModel;
    
    function resetSpies() {
        spyRes.json.calls.reset();
        spyRes.status.calls.reset();
        mockFeedModel.add.calls.reset();
        mockFeedModel.feeds.findOne.calls.reset();
        mockFeedModel.feeds.findMany.calls.reset();
        mockFeedModel.posts.findOne.calls.reset();
        mockFeedModel.posts.findMany.calls.reset();
    }
    
    beforeAll(function () {
        mockFeedModel = {
            feeds: {
                findOne: jasmine.createSpy('feedsFindOne').and.callFake(function () {return Promise.resolve(meta[0])}),
                findMany: jasmine.createSpy('feedsFindMany').and.callFake(function () {return Promise.resolve(meta)})
            },
            posts: {
                findOne: jasmine.createSpy('postsFindOne').and.callFake(function () {return Promise.resolve(item[0])}),
                findMany: jasmine.createSpy('postsFindMnay').and.callFake(function () {return Promise.resolve(item)})
            },
            add: jasmine.createSpy('feedModelAdd').and.returnValue(Promise.resolve({_id: 'spam', title: 'wombles'}))
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
    
    describe('getAll method', function () {
        beforeAll(function (done) {
            spyRes.events.once('jsonCalled', done);
            api_views.getAll({}, spyRes)
        });
        afterAll(resetSpies);
        
        it('should take two paramters', function () {
            expect(api_views.getAll.length).toEqual(2);
        });
        it('should return return a 200 code.', function () {
            expect(spyRes.status.calls.allArgs()).toEqual([[200]]);
        });
        it('should return all the data using res.json()', function () {
            expect(spyRes.json.calls.allArgs()).toEqual([[{meta: meta_res, items: item_res}]]);
        });
    });
    
    describe('postAdd method (with good request)', function () {
        beforeAll(function (done) {
            spyRes.events.once('jsonCalled', done);
            api_views.postAdd({body: {feedurl: 'http://fake/feed/url'}}, spyRes)
        })
        afterAll(resetSpies);
        
        it('should take two paramters', function () {
            expect(api_views.postAdd.length).toEqual(2);
        });
        it('should call model.add(url)', function () {
            expect(mockFeedModel.add.calls.allArgs()).toEqual([['http://fake/feed/url']]);
        });
        it('should call feedModel.posts.findMany to get items results', function () {
            expect(mockFeedModel.posts.findMany.calls.allArgs()).toEqual([[{meta_id: 'spam'}]]);
        });
        it('should return the data using res.json()', function () {
            expect(spyRes.json.calls.allArgs()).toEqual([[{
                meta: [{title: 'wombles', feedurl: undefined, apiurl: '/feeds/spam'}],
                items: item_res
            }]]);
        });
        it('should return return a 201 code.', function () {
            expect(spyRes.status.calls.allArgs()).toEqual([[201]]);
        });
        it('should included a Location header field', function () {
            pending('not yet done...');
        });
    });
    
    describe('postAdd method (with bad request)', function () {
        beforeAll(function (done) {
            spyRes.events.once('jsonCalled', done);   
            api_views.postAdd({body: {bad: 'data'}}, spyRes) 
        })
        afterAll(resetSpies);
        it('should return return a 400 code.', function () {
            expect(spyRes.status.calls.allArgs()).toEqual([[400]]);
        });
    });
    
    describe('postAdd method (with with feed add routine throwing an error)', function () {
        beforeAll(function (done) {
            var _add;
            _add = mockFeedModel.add
            mockFeedModel.add = jasmine.createSpy('feedModelAdd').and.returnValue(Promise.reject('someError'));
            
            spyRes.events.once('jsonCalled', function () {
                mockFeedModel.add = _add;
                done();
            });
            api_views.postAdd({body: {feedurl: 'http://fake/feed/url'}}, spyRes) 
        })
        afterAll(resetSpies);
        it('should return return a 500 code.', function () {
            expect(spyRes.status.calls.allArgs()).toEqual([[500]]);
        });
    });
    
    describe('404 method', function () {
        beforeAll(function (done) {
            spyRes.events.once('jsonCalled', done);   
            api_views['404']({}, spyRes);
        })
        afterAll(resetSpies);
        it('should return return a 404 code.', function () {
            expect(spyRes.status.calls.allArgs()).toEqual([[404]]);
        });
    });
});

