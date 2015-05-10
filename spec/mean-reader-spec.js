var request = require('request'),
    db_helpers = require('./helpers/feed-db-helpers'),
    reader,
    express = require('express'),
    app = express()
    bodyParser = require('body-parser'),
    ObjectID = require('mongodb').ObjectID,
    getFeed = require('../webserv/feed_handle/getFeed');

function jsonReviver(k, v) {
    if (k==='_id') { return (new ObjectID(v)); }
    if (k==='meta_id') { return (new ObjectID(v)); }
    return v;
}

describe('mean-reader', function () {
    
    // Set up the test db and store some test data.
    // Then start up the express server (after the call to
    // setupTestDb has esablished connection to *test* db)
    beforeAll(function (done) {
        db_helpers.setupTestDb()
        .then(db_helpers.insertSample.bind(null, 0))
        .then(db_helpers.insertSample.bind(null, 1))
        .then(function () {
            
            reader = require('../webserv/mean-reader');
            app.use('/reader', bodyParser.json(), reader);
            app.listen(5667);
        })
        .done(done);
    });
    afterAll(db_helpers.closeTestDb);  
  
    describe('GET /reader', function () {
        var res, body;
        
        // make the request only once
        beforeAll(function (done) {
            request({url: 'http://localhost:5667/reader', method: 'GET', json: true, jsonReviver: jsonReviver}, function (err, _res, _body) {
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
            expect(body.meta.length).toEqual(2);
            expect(body.meta).toContain(jasmine.objectContaining(db_helpers.sampledata[0].meta));
            expect(body.meta).toContain(jasmine.objectContaining(db_helpers.sampledata[1].meta));
        });
        it('should return all the feeds\' items', function () {
            expect(body.items.length).toEqual(4);
            expect(body.items).toContain(jasmine.objectContaining(db_helpers.sampledata[0].items[0]));
            expect(body.items).toContain(jasmine.objectContaining(db_helpers.sampledata[1].items[0]));
            expect(body.items).toContain(jasmine.objectContaining(db_helpers.sampledata[0].items[1]));
            expect(body.items).toContain(jasmine.objectContaining(db_helpers.sampledata[1].items[1]));
        });
    });
    
    describe('POST /add', function () {
        var res, body;
        beforeAll(function (done) {
            spyOn(getFeed, 'add').and.returnValue(Promise.resolve(db_helpers.sampledata[0]));
            request({
                url: 'http://localhost:5667/reader/add',
                method: 'POST',
                json: {url: 'http://some.feed.com/thing.rss'},
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
        it('should call getFeed.add and passback the response', function () {
            expect(body).toEqual(db_helpers.sampledata[0]);
        });
    });

        
});


