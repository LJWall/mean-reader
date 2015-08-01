describe('feeds_service', function () {
    beforeEach(module('reader.feeds.service'));

    beforeEach(module(function ($provide) {
        $provide.value('currentUserService', {onSignOut: function () {}});
    }));

    beforeEach(inject(function ($httpBackend, $httpParamSerializer, apiRoot, getMoreNumber, feedService) {
        this.initData = {
            meta: [
                {title: 'Feed', apiurl: 'http://apiurl', unread: 2},
                {title: 'Feed2', apiurl: 'http://apiurl2', unread: 3}
            ],
            items: [
                {title: 'Big cheese', apiurl: 'http://bigcheese/', meta_apiurl: 'http://apiurl', pubdate: '2015-01-01T12:00:00Z'},
                {title: 'Big cheese2', apiurl: 'http://bigcheese2/', meta_apiurl: 'http://apiurl2', pubdate: '2015-01-01T11:00:00Z', read: true}
            ]
        };
        $httpBackend.expectGET(apiRoot + '?' + $httpParamSerializer({'N': 0}))
        .respond(200, {meta: this.initData.meta, items: []}, {'last-modified': '2015-01-01T17:00:00Z'});
        $httpBackend.flush(1);
    }));

    afterEach(inject(function ($httpBackend) {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
        $httpBackend.resetExpectations();
    }));

    it('should produce a tree structure', inject(function (apiRoot, feedService) {
        var tree = feedService.feedTree();
        expect(tree.apiurl).toEqual(apiRoot);
        expect(tree.title).toEqual('All');
        expect(tree.branches.length).toEqual(2);
        expect(tree.branches[0]).toEqual(jasmine.objectContaining({title: 'Feed', apiurl: 'http://apiurl'}));
        expect(tree.branches[1]).toEqual(jasmine.objectContaining({title: 'Feed2', apiurl: 'http://apiurl2'}));
    }));
    it('should indentify correctly number unread at each node', inject(function (feedService) {
        var tree = feedService.feedTree();
        expect(tree.unread()).toEqual(5);
        expect(tree.branches[0].unread()).toEqual(2);
        expect(tree.branches[1].unread()).toEqual(3);
    }));

    describe('getMore()', function () {
        beforeEach(inject(function (feedService, $httpBackend, $httpParamSerializer, getMoreNumber, apiRoot) {
            $httpBackend.expectGET(apiRoot + '?' + $httpParamSerializer({'N': getMoreNumber}))
            .respond(200, this.initData, {'last-modified': '2015-01-01T17:00:00Z'});
            feedService.feedTree().getMore();
            $httpBackend.flush(1);
            this.tree = feedService.feedTree();
        }));
        it('should add items to the tree node', inject(function (feedService) {
            var tree = feedService.feedTree();
            expect(tree.items().length).toEqual(2);
            expect(tree.items()[0]).toEqual(jasmine.objectContaining({title: 'Big cheese', apiurl: 'http://bigcheese/', meta_apiurl: 'http://apiurl'}));
            expect(tree.items()[1]).toEqual(jasmine.objectContaining({title: 'Big cheese2', apiurl: 'http://bigcheese2/', meta_apiurl: 'http://apiurl2'}));
        }));
        it('should calc oldest at node', inject(function (feedService) {
            var tree = feedService.feedTree();
            expect(tree.oldest).toEqual((new Date('2015-01-01T11:00:00Z')).getTime());
        }));
        it('should add items to that node only', function () {
            expect(this.tree.items().length).toEqual(2);
            expect(this.tree.items()[0].title).toEqual('Big cheese');
            expect(this.tree.items()[1].title).toEqual('Big cheese2');
            expect(this.tree.branches[0].items.length).toEqual(0);
            expect(this.tree.branches[1].items.length).toEqual(0);
        });
        it('should advance `oldest` for that feed only', function () {
            expect(this.tree.oldest).toEqual((new Date('2015-01-01T11:00:00Z').getTime()));
            expect(this.tree.branches[0].oldest).toBeUndefined();
            expect(this.tree.branches[1].oldest).toBeUndefined();
        });
        it('should share item object as appropriate', function () {
            pending('implememnet me');
        });
    });

    describe('isMore()', function () {
        it('should be implemented', function () {
            pending('implememnet me');
        });
    });
    describe('addNew()', function () {
        beforeEach(inject(function (feedService, $httpBackend, apiRoot, $httpParamSerializer, getMoreNumber) {
            this.tree = feedService.feedTree();
            this.tree.addItem({title: 'Mystery item', apiurl: 'foo'});
            this.tree.oldest = 99;
            $httpBackend.expectPOST(apiRoot + '/feeds', {feedurl: 'http://newfeed'})
            .respond(201, null, {'Location': 'http://apiurl/new'});
            $httpBackend.expectGET('http://apiurl/new?' + $httpParamSerializer({'N': getMoreNumber}))
            .respond({
                meta: [{title: 'New feed', apiurl: 'http://apiurl/new', unread: 10}],
                items: [
                    {title: 'New post', apiurl: 'http://apiurl/new/post', meta_apiurl: 'http://apiurl/new', pubdate: '2015-01-01T11:30:00Z'},
                    {title: 'New post 2', apiurl: 'http://apiurl/new/post2', meta_apiurl: 'http://apiurl/new', pubdate: '2015-01-01T10:30:00Z'}
                ]
            });
            feedService.addNew('http://newfeed');
            $httpBackend.flush(2);

        }));
        it('should add one new branch to tree top level', function () {
            expect(this.tree.branches.length).toEqual(3);
            expect(this.tree.branches[2].title).toEqual('New feed');
        });
        it('should impact number unread', function () {
            expect(this.tree.unread()).toEqual(15);
        });
        it('should add items to the new branch', function () {
            expect(this.tree.branches[2].items().length).toEqual(2);
        });
        it('should reset the tree root', function () {
            expect(this.tree.items().length).toEqual(0);
            expect(this.tree.oldest).toBeUndefined();
        });
    });
    describe('refresh()', function () {
        beforeEach(inject(function (feedService, $httpBackend, $httpParamSerializer, apiRoot, getMoreNumber) {
            // Get initial data
            $httpBackend.expectGET(apiRoot + '?' + $httpParamSerializer({'N': getMoreNumber}))
            .respond(200, this.initData, {'last-modified': '2015-01-01T17:00:00Z'});
            feedService.feedTree().getMore();
            $httpBackend.flush(1);
            // And refresh
            $httpBackend.expectGET(apiRoot + '?' + $httpParamSerializer({'updated_since': '2015-01-01T17:00:00Z'}))
              .respond({
                  meta: [
                      {title: 'Feed (rename)', apiurl: 'http://apiurl', unread: 1}
                  ],
                  items: [
                      {title: 'Howdy', apiurl: 'http://howdy/', meta_apiurl: 'http://apiurl', pubdate: '2015-01-01T18:00:00Z'},
                      {title: 'Big cheese (rename)', apiurl: 'http://bigcheese/', meta_apiurl: 'http://apiurl', pubdate: '2015-01-01T12:00:00Z', read: true}
                  ]
              });
            feedService.refresh();
            $httpBackend.flush();
            this.tree = feedService.feedTree();
        }));
        it('should update exiting entries', function () {
            expect(this.tree.items()[0].title).toEqual('Big cheese (rename)');
            expect(this.tree.items()[0].read).toBe(true);
        });
        it('should add any new items', function () {
            expect(this.tree.items().length).toEqual(3); // increased by one
            expect(this.tree.branches[0].items().length).toEqual(2); // add the new one here..
            expect(this.tree.branches[1].items().length).toEqual(0);
            expect(this.tree.items()[2].title).toEqual('Howdy');
        });
        it('should redo unread numbers correctly', function () {
            expect(this.tree.unread()).toEqual(4);
            expect(this.tree.branches[0].unread()).toEqual(1);
            expect(this.tree.branches[1].unread()).toEqual(3);
        });
        it('should update feed info correctly', function () {
            expect(this.tree.branches[0].title).toEqual('Feed (rename)');
        });
        it('should add new feed correctly', function () {
            pending('implememnet me');
        });
    });
    describe('Item.markAsRead()', function () {
        beforeEach(inject(function (feedService, $httpBackend, $httpParamSerializer, apiRoot, getMoreNumber) {
            $httpBackend.expectGET(apiRoot + '?' + $httpParamSerializer({'N': getMoreNumber}))
            .respond(200, this.initData, {'last-modified': '2015-01-01T17:00:00Z'});
            feedService.feedTree().getMore();
            $httpBackend.flush(1);
            this.tree = feedService.feedTree();
        }));
        it('should mark as read and re-calculate', inject(function ($httpBackend) {
            $httpBackend.expectPUT(this.tree.items()[0].apiurl, {read: true}).respond({});
            this.tree.items()[0].markAsRead(true);
            $httpBackend.flush();
            expect(this.tree.branches[0].unread()).toEqual(1);
            expect(this.tree.branches[1].unread()).toEqual(3);
            expect(this.tree.unread()).toEqual(4);
            expect(this.tree.items()[0].read).toBe(true);
        }));
        it('should not change unread count if item already read', inject(function ($httpBackend) {
            $httpBackend.expectPUT(this.tree.items()[1].apiurl, {read: true}).respond({});
            this.tree.items()[1].markAsRead(true);
            $httpBackend.flush();
            expect(this.tree.branches[0].unread()).toEqual(2);
            expect(this.tree.branches[1].unread()).toEqual(3);
            expect(this.tree.unread()).toEqual(5);
        }));
        it('should mark as unread if passed false', inject(function ($httpBackend) {
            $httpBackend.expectPUT(this.tree.items()[1].apiurl, {read: false}).respond({});
            this.tree.items()[1].markAsRead(false);
            $httpBackend.flush();
            expect(this.tree.branches[0].unread()).toEqual(2);
            expect(this.tree.branches[1].unread()).toEqual(4);
            expect(this.tree.unread()).toEqual(6);
            expect(this.tree.items()[1].read).toBe(false);
        }));
    });
});
