var reqest_prep = require('../../webserv/request_prep');

describe('request_prep', function () {
  beforeEach(function () {
    this.res = jasmine.createSpyObj('res', ['status', 'send']);
    this.res.status.and.returnValue(this.res);
    this.next = jasmine.createSpy('next');
  });

  it('should work with empty query', function () {
    var req = {query: {}};
    reqest_prep(req, this.res, this.next);
    expect(this.next).toHaveBeenCalled();
    expect(this.res.status).not.toHaveBeenCalled();
    expect(this.res.send).not.toHaveBeenCalled();
  });

  it('should convert updated_since', function () {
    var req = {query: {updated_since: 'Fri Aug 21 2015 14:14:03 GMT+0100 (BST)'}};
    reqest_prep(req, this.res, this.next);
    expect(req.query.updated_since).toEqual(new Date('Fri Aug 21 2015 14:14:03 GMT+0100 (BST)'));
    expect(this.next).toHaveBeenCalled();
  });
  it('should convert older_than', function () {
    var req = {query: {older_than: '2015-08-15T11:39:55.000Z'}};
    reqest_prep(req, this.res, this.next);
    expect(req.query.older_than).toEqual(new Date('2015-08-15T11:39:55.000Z'));
    expect(this.next).toHaveBeenCalled();
  });
  it('should convert N', function () {
    var req = {query: {N: '23'}};
    reqest_prep(req, this.res, this.next);
    expect(req.query.N).toEqual(23);
    expect(this.next).toHaveBeenCalled();
  });
  it('should convert starred=true', function () {
    var req = {query: {starred: 'True'}};
    reqest_prep(req, this.res, this.next);
    expect(req.query.starred).toEqual(true);
    expect(this.next).toHaveBeenCalled();
  });
  it('should convert starred=false', function () {
    var req = {query: {starred: 'FALSE'}};
    reqest_prep(req, this.res, this.next);
    expect(req.query.starred).toEqual(false);
    expect(this.next).toHaveBeenCalled();
  });

  it('should fail on bad older_than', function () {
    var req = {query: {
      older_than: 'Not a date..'
    }};
    reqest_prep(req, this.res, this.next);
    expect(this.next).not.toHaveBeenCalled();
    expect(this.res.status).toHaveBeenCalledWith(400);
    expect(this.res.send).toHaveBeenCalled();
  });

  it('should fail on bad N', function () {
    var req = {query: {
      N: 'Not an int..'
    }};
    reqest_prep(req, this.res, this.next);
    expect(this.next).not.toHaveBeenCalled();
    expect(this.res.status).toHaveBeenCalledWith(400);
    expect(this.res.send).toHaveBeenCalled();
  });
  it('should fail on bad starred', function () {
    var req = {query: {
      starred: 'Not true or false..'
    }};
    reqest_prep(req, this.res, this.next);
    expect(this.next).not.toHaveBeenCalled();
    expect(this.res.status).toHaveBeenCalledWith(400);
    expect(this.res.send).toHaveBeenCalled();
  });
});
