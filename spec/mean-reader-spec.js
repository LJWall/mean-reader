var request = require('request'),
    db_helpers = require('./feed_handle/feed-db-helpers'),
    reader,
    express = require('express'),
    app = express()
    bodyParser = require('body-parser'),
    ObjectID = require('mongodb').ObjectID,
    getFeed = require('../webserv/feed_handle/getFeed'),
    Promise = require('bluebird');

function jsonReviver(k, v) {
    if (k==='_id') { return (new ObjectID(v)); }
    if (k==='meta_id') { return (new ObjectID(v)); }
    return v;
}

xdescribe('mean-reader', function () {
    
    // Set up the test db and store some test data.
    // Then start up the express server (after the call to
    // setupTestDb has esablished connection to *test* db)
    beforeAll(function (done) {
        db_helpers.setupTestDb()
        .then(db_helpers.insertSample.bind(null, 0))
        .then(db_helpers.insertSample.bind(null, 1))
        .then(function () {
            
            reader = require('../webserv/mean-reader');
            app.use('/', bodyParser.json(), reader);
            app.listen(5667);
        })
        .done(done);
    });
    afterAll(db_helpers.closeTestDb);  
  
    describe('GET /', function () {
        var res, body;
        
        // make the request only once
        beforeAll(function (done) {
            request({url: 'http://localhost:5667', method: 'GET', json: true, jsonReviver: jsonReviver}, function (err, _res, _body) {
                if (err) { throw(err) }
                res = _res;
                body = _body;
                done();
            });
        });
        
        it('should return a 200 status code', function () {
            expect(res.statusCode).toEqual(200);
        });
        it('should return all the feeds\' meta data', function () {
            var i;
            expect(body.meta.length).toEqual(2);
            for (i=0; i<=1; i++) {
                expect(body.meta).toContain(jasmine.objectContaining({
                    feedurl: db_helpers.sampledata[i].meta.feedurl,
                    title: db_helpers.sampledata[i].meta.title,
                    description: db_helpers.sampledata[i].meta.description,
                    link: db_helpers.sampledata[i].meta.link,
                    apiurl: '/feeds/' + db_helpers.sampledata[i].meta._id.toString()
                }));
            }
        });
        it('should return all the feeds\' items', function () {
            var i, j;
            expect(body.items.length).toEqual(4);
            for (i=0; i<=1; i++) {
                for (j=0; j<=1; j++) {
                    expect(body.items).toContain(jasmine.objectContaining(db_helpers.sampledata[i].items[j]));
                }
            }
        });
        
    });
    
    describe('POST /feeds', function () {
        describe('with a good request', function () {
            var res, body;
            beforeAll(function (done) {
                spyOn(getFeed, 'add').and.returnValue(Promise.resolve(db_helpers.sampledata[0]));
                request({
                    url: 'http://localhost:5667/feeds',
                    method: 'POST',
                    json: {feedurl: 'http://some.feed.com/thing.rss'},
                    jsonReviver: jsonReviver
                }, function (err, _res, _body) {
                    if (err) { throw(err) }
                    res = _res;
                    body=_body;
                    done();
                });
            });
            
            it('should return a 200 status code', function () {
                expect(res.statusCode).toEqual(200);
            });
            it('should call getFeed.add', function () {
                expect(getFeed.add).toHaveBeenCalledWith('http://some.feed.com/thing.rss');
            });
            it('should passback the response from getFeed.add', function () {
                expect(body).toEqual(db_helpers.sampledata[0]);
            });
        });
        describe('with missing post data', function () {
            var res, body;
            beforeAll(function (done) {
                spyOn(getFeed, 'add').and.returnValue(Promise.resolve(db_helpers.sampledata[0]));
                request({
                    url: 'http://localhost:5667/feeds',
                    method: 'POST',
                    json: {foo: 'bar'},
                    jsonReviver: jsonReviver
                }, function (err, _res, _body) {
                    if (err) { throw(err) }
                    res = _res;
                    body=_body;
                    done();
                });
            });
            it('should return a 400 status code', function () {
                expect(res.statusCode).toEqual(400);
            });
            it('should return a json error in the body', function () {
                expect(body).toEqual({error: 'feedurl parameter required', msg: 'Something went wrong'});
            });
            it('should not call getFeed.add', function () {
                expect(getFeed.add).not.toHaveBeenCalled();
            });
        });
    });
    
    
});


