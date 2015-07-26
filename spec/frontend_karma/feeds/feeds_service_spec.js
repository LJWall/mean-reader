describe('feeds_service', function () {
    beforeEach(module('reader.feeds.service'));

    beforeEach(module(function ($provide) {
        $provide.value('currentUserService', {onSignOut: function () {}});
    }));

    beforeEach(inject(function ($httpBackend, $httpParamSerializer, apiRoot, getMoreNumber) {
        this.initData = {
            meta: [
                {title: 'Feed', apiurl: 'http://apiurl'},
                {title: 'Feed2', apiurl: 'http://apiurl2'}
            ],
            items: [
                {title: 'Big cheese', apiurl: 'http://bigcheese/', meta_apiurl: 'http://apiurl', pubdate: '2015-01-01T12:00:00Z'},
                {title: 'Big cheese2', apiurl: 'http://bigcheese2/', meta_apiurl: 'http://apiurl2', pubdate: '2015-01-01T11:00:00Z', read: true}
            ]
        };
        $httpBackend.expectGET(apiRoot + '?' + $httpParamSerializer({'N': getMoreNumber})).respond(this.initData);
    }));

    afterEach(inject(function ($httpBackend) {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
        $httpBackend.resetExpectations();
    }));

    it('should produce a tree structure', inject(function (apiRoot, feedService, $httpBackend) {
        $httpBackend.flush();
        var tree = feedService.feedTree();
        expect(tree.apiurl).toEqual(apiRoot);
        expect(tree.title).toEqual('All');
        expect(tree.branches.length).toEqual(2);
        expect(tree.branches[0]).toEqual(jasmine.objectContaining({title: 'Feed', apiurl: 'http://apiurl'}));
        expect(tree.branches[1]).toEqual(jasmine.objectContaining({title: 'Feed2', apiurl: 'http://apiurl2'}));
    }));
    it('should add items to root tree node', inject(function (apiRoot, feedService, $httpBackend) {
        $httpBackend.flush();
        var tree = feedService.feedTree();
        expect(tree.items.length).toEqual(2);
        expect(tree.items[0]).toEqual(jasmine.objectContaining({title: 'Big cheese', apiurl: 'http://bigcheese/', meta_apiurl: 'http://apiurl'}));
        expect(tree.items[1]).toEqual(jasmine.objectContaining({title: 'Big cheese2', apiurl: 'http://bigcheese2/', meta_apiurl: 'http://apiurl2'}));
    }));
    it('should add items to tree branch nodes', inject(function (apiRoot, feedService, $httpBackend) {
        $httpBackend.flush();
        var tree = feedService.feedTree();
        expect(tree.branches[0].items.length).toEqual(1);
        expect(tree.branches[0].items[0]).toEqual(jasmine.objectContaining({title: 'Big cheese', apiurl: 'http://bigcheese/', meta_apiurl: 'http://apiurl'}));
        expect(tree.branches[1].items.length).toEqual(1);
        expect(tree.branches[1].items[0]).toEqual(jasmine.objectContaining({title: 'Big cheese2', apiurl: 'http://bigcheese2/', meta_apiurl: 'http://apiurl2'}));
    }));
    it('should calc oldest at each nodes', inject(function (apiRoot, feedService, $httpBackend) {
        $httpBackend.flush();
        var tree = feedService.feedTree();
        expect(tree.oldest).toEqual((new Date('2015-01-01T11:00:00Z')).getTime());
        expect(tree.branches[0].oldest).toEqual((new Date('2015-01-01T12:00:00Z')).getTime());
        expect(tree.branches[1].oldest).toEqual((new Date('2015-01-01T11:00:00Z')).getTime());
    }));

    describe('getMore() on individual feed', function () {
        beforeEach(inject(function (feedService, $httpBackend, $httpParamSerializer, getMoreNumber) {
            $httpBackend.flush();
            this.tree = feedService.feedTree();
            $httpBackend.expectGET(this.tree.branches[0].apiurl + '?' + $httpParamSerializer({'N': getMoreNumber, 'older_than': new Date('2015-01-01T12:00:00Z')}))
              .respond({
                  meta: [this.initData.meta[0]],
                  items: [{title: 'Howdy', apiurl: 'http://howdy/', meta_apiurl: 'http://apiurl', pubdate: '2015-01-01T09:00:00Z'}]});
            this.tree.branches[0].getMore();
            $httpBackend.flush();
        }));
        it('should add items to that feed only', function () {
            expect(this.tree.items.length).toEqual(2);
            expect(this.tree.branches[1].items.length).toEqual(1);
            expect(this.tree.branches[0].items.length).toEqual(2);
            expect(this.tree.branches[0].items[1].title).toEqual('Howdy');
        });
        it('should advance `oldest` for that feed only', function () {
            expect(this.tree.oldest).toEqual((new Date('2015-01-01T11:00:00Z').getTime()));
            expect(this.tree.branches[0].oldest).toEqual((new Date('2015-01-01T09:00:00Z').getTime()));
            expect(this.tree.branches[1].oldest).toEqual((new Date('2015-01-01T11:00:00Z').getTime()));
        });
    });
    describe('getMore() on tree root', function () {
        beforeEach(inject(function (feedService, $httpBackend, $httpParamSerializer, getMoreNumber, apiRoot) {
            $httpBackend.flush();
            this.tree = feedService.feedTree();
            $httpBackend.expectGET(apiRoot + '?' + $httpParamSerializer({'N': getMoreNumber, 'older_than': new Date('2015-01-01T11:00:00Z')}))
              .respond({
                  meta: this.initData.meta,
                  items: [
                      {title: 'Howdy', apiurl: 'http://howdy/', meta_apiurl: 'http://apiurl', pubdate: '2015-01-01T09:00:00Z'},
                      {title: 'Foo', apiurl: 'http://Foo/', meta_apiurl: 'http://apiurl2', pubdate: '2015-01-01T08:00:00Z'}
                  ]});
            this.tree.getMore();
            $httpBackend.flush();
        }));
        it('should add items to the right tree nodes', function () {
            expect(this.tree.items.length).toEqual(4);
            expect(this.tree.branches[0].items.length).toEqual(2);
            expect(this.tree.branches[1].items.length).toEqual(2);
            expect(this.tree.branches[0].items[1].title).toEqual('Howdy');
            expect(this.tree.branches[1].items[1].title).toEqual('Foo');
        });
        it('should advance `oldest` appropriately', function () {
            expect(this.tree.oldest).toEqual((new Date('2015-01-01T08:00:00Z').getTime()));
            expect(this.tree.branches[0].oldest).toEqual((new Date('2015-01-01T09:00:00Z').getTime()));
            expect(this.tree.branches[1].oldest).toEqual((new Date('2015-01-01T08:00:00Z').getTime()));
        });
    });

});
