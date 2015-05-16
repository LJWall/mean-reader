var rewire = require('rewire'),
    mod_api_routes = rewire('../webserv/api_routes');

var mockApp = {
    get: jasmine.createSpy('app.get'),
    post: jasmine.createSpy('app.post'),
    use:jasmine.createSpy('app.use')
};
var mockExpress = function () {
    return mockApp;
}

var views_obj = {
        getAll: function () {return 1;},
        postAdd: function () {return 2;},
        '404': function () {return 3;}
};

var mockModViews = jasmine.createSpy('mod_views').and.callFake(function () {
    return views_obj;
});



describe('api_routes', function () {
    beforeAll(function () {
        mod_api_routes.__set__('express', mockExpress);
        mod_api_routes.__set__('mod_views', mockModViews);
        mod_api_routes('/root');
    });
    
    it('should call api_views with url_for object', function () {
        expect(mockModViews.calls.count()).toEqual(1);
        expect(mockModViews).toHaveBeenCalledWith(mod_api_routes.__get__('url_for'));
    });
    
    it('should route / to views.getAll', function () {
        expect(mockApp.get).toHaveBeenCalledWith('/', views_obj.getAll);
    });
    it('should route posts to /feeds to views.postAdd', function () {
        expect(mockApp.post).toHaveBeenCalledWith('/feeds', views_obj.postAdd);
    });
    it('should make handle 404', function () {
        expect(mockApp.use).toHaveBeenCalledWith(views_obj['404']);
    });
    
    describe('url_for [internal function]', function () {
        it('should return /root/feeds/[id] for a feed api url', function () {
            expect(mod_api_routes.__get__('url_for').feed(1))
            .toEqual('/root/feeds/1');
        })
        it('should return /root/posts/[id] for a post api url', function () {
            expect(mod_api_routes.__get__('url_for').item(7))
            .toEqual('/root/posts/7');
        })
    });
    
});




