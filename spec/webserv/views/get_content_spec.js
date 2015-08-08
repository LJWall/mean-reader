var get_content = require('../../../webserv/views/get_content'),
    test_data = require('../api_views_test_data.json'),
    util = require('./setup_util');

describe('getContent method', function () {
    var spyRes;

    beforeAll(util.prepTestData);
    beforeAll(util.makeResSpy);
    beforeAll(function () {
        spyRes = this.spyRes;
    });

    beforeEach(util.insertTestData);

    afterEach(util.deleteTestData);
    afterEach(util.resetSpies);
    afterEach(util.clearListner);

    it('should return data and 200 code on good request', function (done) {
        spyRes.events.once('responseComplete', function () {
            expect(spyRes.status.calls.allArgs()).toEqual([[200]]);
            expect(spyRes.type.calls.allArgs()).toEqual([['html']]);
            expect(spyRes.set.calls.allArgs()).toContain(['cache-control', 'public, max-age=604800']);
            expect(spyRes.send.calls.allArgs()).toEqual([[test_data.content.content]]);
            done();
        });
        get_content({params: {ObjectID: test_data.content._id}}, spyRes);
    });

    it('should return 404 and no content on bad ObjectID', function (done) {
        spyRes.events.once('responseComplete', function () {
            expect(spyRes.status.calls.allArgs()).toEqual([[404]]);
            expect(spyRes.end.calls.allArgs()).toEqual([[]]);
            done();
        });
        get_content({params: {ObjectID: 'foo'}}, spyRes);
    });
});
