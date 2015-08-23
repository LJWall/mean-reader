var get_items = require('../../../webserv/views/get_items'),
    test_data = require('../api_views_test_data.json'),
    util = require('./setup_util'),
    url_for = require('../../../webserv/url_for'),
    clean = require('../../../webserv/views/cleaning_util');

describe('get_items', function () {
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
      get_items({user: {_id: 'IMPOSTER'}, query: {}, params: {}}, this.spyRes);
    });

    it('should return data using res.json()', function (done) {
        var self = this;
        this.spyRes.events.once('responseComplete', function () {
            expect(self.spyRes.json.calls.count()).toEqual(1);
            var data = self.spyRes.json.calls.argsFor(0)[0];
            expect(data.items.length).toEqual(2);
            expect(data.items[0]).toEqual(clean.cleanItem(test_data.item[1]));
            expect(data.items[1]).toEqual(clean.cleanItem(test_data.item[2]));
            done();
        });
        get_items({user: {_id: 'IMPOSTER'}, query: {}, params: {}}, this.spyRes);
    });

    it('should respect limit via N query parameter', function (done) {
        var self = this;
        this.spyRes.events.once('responseComplete', function () {
            expect(self.spyRes.json.calls.count()).toEqual(1);
            var data = self.spyRes.json.calls.argsFor(0)[0];
            expect(data.items.length).toEqual(1);
            done();
        });
        get_items({user: {_id: 'IMPOSTER'}, query: {N: 1}, params: {}}, this.spyRes);
    });

    it('should respect starred=true query parameter', function (done) {
        var self = this;
        this.spyRes.events.once('responseComplete', function () {
            expect(self.spyRes.json.calls.count()).toEqual(1);
            var data = self.spyRes.json.calls.argsFor(0)[0];
            expect(data.items.length).toEqual(1);
            expect(data.items[0]).toEqual(clean.cleanItem(test_data.item[2]));
            done();
        });
        get_items({user: {_id: 'IMPOSTER'}, query: {starred: true}, params: {}}, this.spyRes);
    });

    it('should respect starred=false query parameter', function (done) {
        var self = this;
        this.spyRes.events.once('responseComplete', function () {
            expect(self.spyRes.json.calls.count()).toEqual(1);
            var data = self.spyRes.json.calls.argsFor(0)[0];
            expect(data.items.length).toEqual(1);
            expect(data.items[0]).toEqual(clean.cleanItem(test_data.item[1]));
            done();
        });
        get_items({user: {_id: 'IMPOSTER'}, query: {starred: false}, params: {}}, this.spyRes);
    });

    it('should respect older_than query parameter', function (done) {
        var self = this;
        this.spyRes.events.once('responseComplete', function () {
            expect(self.spyRes.json.calls.count()).toEqual(1);
            var data = self.spyRes.json.calls.argsFor(0)[0];
            expect(data.items.length).toEqual(1);
            expect(data.items[0]).toEqual(clean.cleanItem(test_data.item[2]));
            done();
        });
        get_items({user: {_id: 'IMPOSTER'}, query: {older_than: new Date('2015-01-02T11:35:00.000Z')}, params: {}}, this.spyRes);
    });
});
