var rewire = require('rewire'),
    Promise = require('bluebird'),
    xsrf = rewire('../webserv/auth/xsrf/xsrf'),
    uid_safeSpy =  jasmine.createSpy();

xsrf.__set__('uid_safe', uid_safeSpy);


describe('module: xsrf', function () {
    it('should expose a function get_xsrf_token() of length 2', function () {
        expect(typeof xsrf.get_xsrf_token).toEqual('function');
        expect(xsrf.get_xsrf_token.length).toEqual(2);
    });
    
    it('should expose a function check_xsrf_header of length 3', function () {
        expect(typeof xsrf.check_xsrf_header).toEqual('function');
        expect(xsrf.check_xsrf_header.length).toEqual(3);
    
    });
    describe('get_xsrf_token() [happy case]', function () {
        beforeAll(function (done) {
            this.res = jasmine.createSpyObj('res spy', ['end', 'status', 'cookie']);
            this.res.status.and.returnValue(this.res);
            this.res.end.and.callFake(done);
            this.req = {session: {}};
            uid_safeSpy.and.returnValue(Promise.resolve('foobar') );

            xsrf.get_xsrf_token(this.req, this.res);
        });
        it('should call uuid-safe exactly once, with parameter 50', function () {
            expect(uid_safeSpy.calls.count()).toEqual(1);
            expect(uid_safeSpy).toHaveBeenCalledWith(50);
        });
        it('should set a cookie with name XSRF-TOKEN on the reqest, with uuid-safe result', function () {
            expect(this.res.cookie.calls.count()).toEqual(1);
            expect(this.res.cookie).toHaveBeenCalledWith('XSRF-TOKEN', 'foobar', {httpOnly: false});
        });
        it('should store as value on the session with key XSRF_TOKEN, with uuid-safe result', function () {
            expect(this.req.session['XSRF-TOKEN']).toEqual('foobar');
        });
        it('should normally return a 200 response', function () {
            expect(this.res.status.calls.count()).toEqual(1);
            expect(this.res.status).toHaveBeenCalledWith(200);
        });
    });
    describe('get_xsrf_token() [unhappy case]', function () {
        beforeAll(function (done) {
            this.res = jasmine.createSpyObj('res spy', ['end', 'status', 'cookie']);
            this.res.status.and.returnValue(this.res);
            this.res.end.and.callFake(done);
            this.req = {session: {}};
            uid_safeSpy.and.returnValue(Promise.reject(new Error('foo')));

            xsrf.get_xsrf_token(this.req, this.res);
        });
        it('should return a 500 response on error from uuid-safe', function () {
            expect(this.res.status).toHaveBeenCalledWith(500);
            expect(this.res.status.calls.count()).toEqual(1);
        });
    });
    describe('check_xsrf_header()', function () {
        beforeEach(function () {
            this.res = jasmine.createSpyObj('res spy', ['end', 'status']);
            this.res.status.and.returnValue(this.res);
            this.req = {session: {}, headers: {}};
            this.next = jasmine.createSpy('next spy')
        });
        it('should return a 401 if there is no X-XSRF-TOKEN header', function () {
            xsrf.check_xsrf_header(this.req, this.res, this.next);
            expect(this.next).not.toHaveBeenCalled();
            expect(this.res.status.calls.count()).toEqual(1);
            expect(this.res.status).toHaveBeenCalledWith(401);
            expect(this.res.end.calls.count()).toEqual(1);
        });
        it('should return a 401 if X-XSRF-TOKEN header does not match the session XSRF-TOKEN', function () {
            this.req.headers['X-XSRF-TOKEN'] = 'foo';
            xsrf.check_xsrf_header(this.req, this.res, this.next);
            expect(this.next).not.toHaveBeenCalled();
            expect(this.res.status.calls.count()).toEqual(1);
            expect(this.res.status).toHaveBeenCalledWith(401);
            expect(this.res.end.calls.count()).toEqual(1);
        });
        it('should call next() if all is well, and not call end() or status() on the responce', function () {
            this.req.headers['X-XSRF-TOKEN'] = 'foo';
            this.req.session['XSRF-TOKEN'] = 'foo';
            xsrf.check_xsrf_header(this.req, this.res, this.next);
            expect(this.next.calls.count()).toEqual(1);
            expect(this.res.status.calls.count()).toEqual(0);
            expect(this.res.status).not.toHaveBeenCalled();
            expect(this.res.end.calls.count()).toEqual(0);
        });
    });
});
