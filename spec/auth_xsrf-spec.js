var rewire = require('rewire'),
    Promise = require('bluebird'),
    xsrf = rewire('../webserv/auth/xsrf/xsrf');


xsrf.__set__('uid_safe', function () { return Promise.resolve('foobar'); } );


describe('module: xsrf', function () {
    it('should expose a function get_xsrf_token() of length 2', function () {
        expect(typeof xsrf.get_xsrf_token).toEqual('function');
        expect(xsrf.get_xsrf_token.length).toEqual(2);
    });
    
    it('shoudl expose a function check_xsrf_header of length 3', function () {
        expect(typeof xsrf.check_xsrf_header).toEqual('function');
        expect(xsrf.check_xsrf_header.length).toEqual(3);
    
    });
    describe('get_xsrf_token()', function () {
        xit('should call uuid-safe exactly once, with parameter 50', function () {
            expect();
        });
        it('should set a cookie with name XSRF-TOKEN on the reqest, with uuid-safe result');
        it('should store as value on the session with key XSRF-TOKEN, with uuid-safe result');
        it('should normally return a 200 response');
        it('should rturn a 500 response on error from uuid-safe');
    });
});
