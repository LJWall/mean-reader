var rewire = require('rewire'),
    api_views_maker = rewire('../webserv/api_views'),
    Promise = require('bluebird'),
    ObjectID = require('mongodb').ObjectID,
    events = require('events');



describe('api_views modulue', function () {
    it('should export a function taking one paramter', function () {
        expect(typeof api_views_maker).toEqual('function');
        expect(api_views_maker.length).toEqual(1);
    });
    
    it('should use nice \'cleaning\' functions', function () {
        pending('should test the cleaning function, and the one using reduce to filter out errors.');
    });
});

describe('api_views object', function () {
    var api_views, spyRes, mockFeedModel, saveSpy,
        meta, item, meta_res, item_res;
        
    function resetTestData() {
        meta = [{_id: new ObjectID(), feedurl: 'url1', title: 'Blog1', description: 'Interesting', surplus_data: 'junk', save: saveSpy},
                {_id: new ObjectID(), feedurl: 'url2', title: 'Blog2', link: 'link2', surplus_data: 'junk', save: saveSpy}];
        item = [{_id: new ObjectID(), meta_id: meta[0]._id, link: 'itemlink1', title: 'Foo', surplus_data: 'junk', pubdate: '2015-01-01', save: saveSpy},
                {_id: new ObjectID(), meta_id: meta[1]._id, link: 'itemlink2', title: 'Bar', surplus_data: 'junk', pubdate: '2015-01-02', read: true, save: saveSpy}];
        meta_res = [{apiurl: '/feeds/' + meta[0]._id.toString(), feedurl: 'url1', title: 'Blog1', description: 'Interesting'},
                    {apiurl: '/feeds/' + meta[1]._id.toString(), feedurl: 'url2', title: 'Blog2', link: 'link2'}];
        item_res = [{apiurl: '/items/' + item[0]._id.toString(), meta_apiurl: '/feeds/' + meta[0]._id.toString(), link: 'itemlink1', title: 'Foo', pubdate: '2015-01-01', read: false},
                    {apiurl: '/items/' + item[1]._id.toString(), meta_apiurl: '/feeds/' + meta[1]._id.toString(), link: 'itemlink2', title: 'Bar', pubdate: '2015-01-02', read: true}];
    }
        
            
    function resetSpies() {
        spyRes.json.calls.reset();
        spyRes.status.calls.reset();
        mockFeedModel.add.calls.reset();
        mockFeedModel.feeds.findOne.calls.reset();
        mockFeedModel.feeds.findMany.calls.reset();
        mockFeedModel.posts.findOne.calls.reset();
        mockFeedModel.posts.findMany.calls.reset();
        saveSpy.calls.reset();
    }
    
    function clearListner() {
        spyRes.events.removeAllListeners();
    }
    
    beforeAll(function () {
        saveSpy = jasmine.createSpy('modelSave').and.callFake(function () { return Promise.resolve(this); });
        resetTestData();
        mockFeedModel = {
            feeds: {
                findOne: jasmine.createSpy('feedsFindOne').and.callFake(function () { return Promise.resolve(meta[0]); }),
                findMany: jasmine.createSpy('feedsFindMany').and.callFake(function () { return Promise.resolve(meta); })
            },
            posts: {
                findOne: jasmine.createSpy('postsFindOne').and.callFake(function (q) {
                    if (q && q._id) {
                        if (q._id.toHexString()===item[0]._id.toHexString()) return Promise.resolve(item[0]);
                        if (q._id.toHexString()===item[1]._id.toHexString()) return Promise.resolve(item[1]);
                    }
                    return Promise.resolve(null);
                }),
                findMany: jasmine.createSpy('postsFindMnay').and.callFake(function () { return Promise.resolve(item); })
            },
            add: jasmine.createSpy('feedModelAdd').and.returnValue(Promise.resolve({_id: 'spam', title: 'wombles'}))
        };
        var mockUrlFor = {
            feed: function (id) {return '/feeds/'+id;},
            item: function (id) {return '/items/'+id;},
        };
        
        api_views_maker.__set__('feedModelMaker', function () { return mockFeedModel; });
        api_views = api_views_maker(mockUrlFor);
        
        spyRes = jasmine.createSpyObj('res', ['json', 'status', 'end']);
        spyRes.status.and.returnValue(spyRes);
        spyRes.events = new events.EventEmitter();
        spyRes.json.and.callFake(function () {
            setTimeout(spyRes.events.emit.bind(spyRes.events, 'responseComplete'), 0);
            return spyRes;
        });
        spyRes.end.and.callFake(function () {
            setTimeout(spyRes.events.emit.bind(spyRes.events, 'responseComplete'), 0);
            return spyRes;
        });
    });
    
    describe('getAll method', function () {
        beforeAll(function (done) {
            spyRes.events.once('responseComplete', done);
            api_views.getAll({}, spyRes);
        });
        afterAll(resetSpies);
        afterAll(clearListner);
        
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
    
    describe('putPost method', function () {
        
        it('should take two parameters', function () {
            expect(api_views.putPost.length).toEqual(2);
        });
        
        describe('[usual request process]', function () {
            beforeAll(function (done) {
                spyRes.events.once('responseComplete', done);
                api_views.putPost({body: {}, params: {item_id: item[0]._id.toHexString()}}, spyRes);
            });
            afterAll(resetSpies);
            afterAll(resetTestData);
            afterAll(clearListner);
            
            it('should call feedModel.posts.findOne to get the item', function () {
                expect(mockFeedModel.posts.findOne.calls.allArgs()).toEqual([[{_id: item[0]._id}]]);
            });
            
            it('should call save on the item', function () {
                expect(saveSpy.calls.count()).toEqual(1);
            });
            it('should return a 200 code', function () {
                expect(spyRes.status.calls.allArgs()).toEqual([[200]]);
            });
            it('should return the item data', function () {
                expect(spyRes.json.calls.allArgs()).toEqual([[item_res[0]]]);
            });
        });
        
        // Helper function whcih returns function which posts the given data and calls the
        // callback on response.
        function post(post_data, test_cb) {
            return function (done) {
                spyRes.events.once('responseComplete', function () {
                    test_cb();
                    done();
                });
                api_views.putPost(post_data(), spyRes);
            };
        }
        
        describe('[detail]', function () {
            afterEach(resetSpies);
            afterEach(resetTestData);
            afterEach(clearListner);
            
            it('should set read=true on the item when PUT data contains read=true', post(
                function () { return {body: {read: true}, params: {item_id: item[0]._id.toHexString()}}; },
                function () { expect(item[0].read).toEqual(true); }
            ));
            it('should set read=false on the item when PUT data contains read=false', post(
                function () { return {body: {read: false}, params: {item_id: item[1]._id.toHexString()}}; },
                function () { expect(item[1].read).toEqual(false); }
            ));
            it('should return 500 error if no item_id on req.params', post(
                function () { return {body: {}, params: {}}; },
                function () { expect(spyRes.status.calls.allArgs()).toEqual([[500]]); }
            ));
            it('should return 404 error if item cannot be found', post(
                function () { return {body: {}, params: {item_id: 'aaaaaaaaaaaaaaaaaaaaaaaa'}}; },
                function () { expect(spyRes.status.calls.allArgs()).toEqual([[404]]); }
            ));
            it('should return 404 error if item_id does not make a good ObjectID', post(
                function () { return {body: {}, params: {item_id: 'fooo*'}}; },
                function () { expect(spyRes.status.calls.allArgs()).toEqual([[404]]); }
            ));
        });
    });
    
    describe('postAdd method (with good request)', function () {
        beforeAll(function (done) {
            spyRes.events.once('responseComplete', done);
            api_views.postAdd({body: {feedurl: 'http://fake/feed/url'}}, spyRes);
        });
        afterAll(resetSpies);
        afterAll(clearListner);
        
        it('should take two paramters', function () {
            expect(api_views.postAdd.length).toEqual(2);
        });
        it('should call model.add(url)', function () {
            expect(mockFeedModel.add.calls.allArgs()).toEqual([['http://fake/feed/url']]);
        });
        it('should call feedModel.posts.findMany to get items results', function () {
            expect(mockFeedModel.posts.findMany.calls.allArgs()).toEqual([[{meta_id: 'spam'}]]);
        });
        it('should return the data (using res.json())', function () {
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
            spyRes.events.once('responseComplete', done);   
            api_views.postAdd({body: {bad: 'data'}}, spyRes);
        });
        afterAll(resetSpies);
        afterAll(clearListner);
        it('should return return a 400 code.', function () {
            expect(spyRes.status.calls.allArgs()).toEqual([[400]]);
        });
    });
    
    describe('postAdd method (with with feed add routine throwing an error)', function () {
        beforeAll(function (done) {
            var _add;
            _add = mockFeedModel.add;
            mockFeedModel.add = jasmine.createSpy('feedModelAdd').and.returnValue(Promise.reject('someError'));
            
            spyRes.events.once('responseComplete', function () {
                mockFeedModel.add = _add;
                done();
            });
            api_views.postAdd({body: {feedurl: 'http://fake/feed/url'}}, spyRes);
        });
        afterAll(resetSpies);
        afterAll(clearListner);
        it('should return return a 500 code.', function () {
            expect(spyRes.status.calls.allArgs()).toEqual([[500]]);
        });
    });
    
    describe('404 method', function () {
        beforeAll(function (done) {
            spyRes.events.once('responseComplete', done);   
            api_views['404']({}, spyRes);
        });
        afterAll(resetSpies);
        afterAll(clearListner);
        it('should return return a 404 code.', function () {
            expect(spyRes.status.calls.allArgs()).toEqual([[404]]);
        });
    });
});

