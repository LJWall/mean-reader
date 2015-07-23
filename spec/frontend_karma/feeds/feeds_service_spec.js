describe('feeds_service', function () {
    beforeEach(module('reader.feeds.service'));

    beforeEach(module(function ($provide) {
        $provide.value('currentUserService', {onSignOut: function () {}});
    }));

    afterEach(inject(function ($httpBackend) {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
        $httpBackend.resetExpectations();
    }));

    describe('loading', function () {
        beforeEach(inject(function ($httpBackend, $httpParamSerializer, apiRoot, getMoreNumber) {
            this.initData = {
                meta: [{title: 'Feed', apiurl: 'http://apiurl'}],
                items: [{title: 'Big cheese', apiurl: 'http://bigcheese/', meta_apiurl: 'http://apiurl'}]
            };
            $httpBackend.expectGET(apiRoot + '?' + $httpParamSerializer({'N': getMoreNumber})).respond(this.initData);
        }));

        it('should get some initial data', inject(function (feedService, $httpBackend) {
            $httpBackend.flush();
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        }));

        it('should make feed meta data available', inject(function (feedService, $httpBackend) {
            $httpBackend.flush();
            var metadata = feedService.getFeedMetaList();
            expect(metadata.length).toEqual(1);
            expect(metadata[0].title).toEqual(this.initData.meta[0].title);
            expect(metadata[0].apiurl).toEqual(this.initData.meta[0].apiurl);
        }));

        it('should make item data available', inject(function (feedService, $httpBackend) {
            $httpBackend.flush();
            var items = feedService.getFeedItems();
            expect(items.length).toEqual(1);
            expect(items[0].title).toEqual(this.initData.items[0].title);
            expect(items[0].apiurl).toEqual(this.initData.items[0].apiurl);
            expect(items[0].meta_apiurl).toEqual(this.initData.items[0].meta_apiurl);
        }));
    });
});
