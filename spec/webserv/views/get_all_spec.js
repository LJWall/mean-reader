var get_all = require('../../../webserv/views/get_all'),
    url_for = require('../../../webserv/url_for'),
    util = require('./setup_util'),
    test_data = require('../api_views_test_data.json');

var mockFeedModel, saveSpy,
    meta, item, meta_res, item_res;

beforeAll(util.prepTestData);

describe('getAll method', function () {
    beforeAll(util.makeResSpy);
    beforeAll(util.insertTestData);
    afterAll(util.deleteTestData);
    beforeAll(function (done) {
        this.spyRes.events.once('responseComplete', done);
        get_all({user: {_id: 'FOO_UID'}, query: {}}, this.spyRes);
    });
    afterAll(util.resetSpies);
    afterAll(util.clearListner);

    it('should take two paramters', function () {
        expect(get_all.length).toEqual(2);
    });
    it('should return return a 200 code.', function () {
        expect(this.spyRes.status.calls.allArgs()).toEqual([[200]]);
    });
    it('should return data (for the authenticated user) using res.json()', function () {
        expect(this.spyRes.json.calls.count()).toEqual(1);
        var data = this.spyRes.json.calls.argsFor(0)[0];
        expect(data.meta.length).toEqual(1);
        expect(data.meta[0]).toEqual({
            feedurl: test_data.meta[0].feedurl,
            title: test_data.meta[0].title,
            userTitle: test_data.meta[0].userTitle,
            description: test_data.meta[0].description,
            apiurl: url_for.feed(test_data.meta[0]._id),
            unread: 1,
            labels: test_data.meta[0].labels
        });
        expect(data.items.length).toEqual(1);
        expect(data.items[0]).toEqual({
            apiurl: url_for.item(test_data.item[0]._id),
            meta_apiurl:  url_for.feed(test_data.item[0].meta_id),
            link: test_data.item[0].link,
            title: test_data.item[0].title,
            pubdate: test_data.item[0].pubdate,
            read: false
        });
    });
    it('should set a last-modified header', function () {
        expect(this.spyRes.set.calls.allArgs()).toContain(['last-modified', new Date('2000-01-01 13:00')]);
    });
});

describe('getAll method with updated_since query paramter', function () {
    beforeAll(util.insertTestData);
    beforeAll(util.makeResSpy);
    afterAll(util.deleteTestData);
    afterAll(util.resetSpies);
    afterAll(util.clearListner);

    beforeAll(function (done) {
        this.updated_since =  new Date('2000-01-01 12:30');
        this.spyRes.events.once('responseComplete', done);
        get_all({user: {_id: 'FOO_UID'}, query: {updated_since: this.updated_since}}, this.spyRes);
    });
    it('should only return newly updated data', function () {
        var data = this.spyRes.json.calls.argsFor(0)[0];
        expect(data.meta.length).toEqual(0);
        expect(data.items.length).toEqual(1);
    });
});

describe('getAll method with older_than query paramter', function () {
    it('should return the right data');
});
