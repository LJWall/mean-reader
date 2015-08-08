var get_feed = require('../../../webserv/views/get_feed'),
    test_data = require('../api_views_test_data.json'),
    util = require('./setup_util'),
    url_for = require('../../../webserv/url_for');

    var mockFeedModel, saveSpy,
        meta, item, meta_res, item_res;


describe('getFeed method', function () {
    beforeAll(util.prepTestData);
    beforeAll(util.insertTestData);
    beforeAll(util.makeResSpy);

    beforeEach(util.resetSpies);

    afterAll(util.deleteTestData);
    afterAll(util.resetSpies);
    afterAll(util.clearListner);

    it('should return a 200 code', function (done) {
      var self = this;
      this.spyRes.events.once('responseComplete', function () {
          expect(self.spyRes.status.calls.allArgs()).toEqual([[200]]);
          done();
      });
      get_feed({user: {_id: 'IMPOSTER'}, query: {}, params: {ObjectID: test_data.meta[1]._id}}, this.spyRes);
    });

    it('should return data using res.json()', function (done) {
        var self = this;
        this.spyRes.events.once('responseComplete', function () {
            expect(self.spyRes.json.calls.count()).toEqual(1);
            var data = self.spyRes.json.calls.argsFor(0)[0];
            expect(data.meta.length).toEqual(1);
            expect(data.meta[0]).toEqual({
                feedurl: test_data.meta[1].feedurl,
                title: test_data.meta[1].title,
                link: test_data.meta[1].link,
                apiurl: url_for.feed(test_data.meta[1]._id),
                unread: 1
            });
            expect(data.items.length).toEqual(1);
            expect(data.items[0]).toEqual({
                apiurl: url_for.item(test_data.item[1]._id),
                meta_apiurl:  url_for.feed(test_data.item[1].meta_id),
                link: test_data.item[1].link,
                title: test_data.item[1].title,
                pubdate: test_data.item[1].pubdate,
                read: false
            });
            done();
        });
        get_feed({user: {_id: 'IMPOSTER'}, query: {}, params: {ObjectID: test_data.meta[1]._id}}, this.spyRes);
    });
    it('should set a content url if there is one', function (done) {
        var self = this;
        this.spyRes.events.once('responseComplete', function () {
            expect(self.spyRes.json.calls.argsFor(0)[0].items[0].content_apiurl).toEqual(url_for.content('foo'));
            done();
        });
        get_feed({user: {_id: 'IMPOSTER'}, query: {}, params: {ObjectID: test_data.meta[2]._id}}, this.spyRes);
    });
});

describe('getFeed method with older_than query paramter', function () {
    it('should return the right data');
});
