var Promise = require('bluebird'),
    events = require('events'),
    test_data = require('../api_views_test_data.json'),
    mongoConn = require('../../../webserv/mongoConnect.js');

module.exports.prepTestData = function () {
    for (i=0; i<test_data.meta.length; i++) {
        test_data.meta[i].last_update = new Date(test_data.meta[i].last_update);
    }
    for (i=0; i<test_data.item.length; i++) {
        test_data.item[i].last_update = new Date(test_data.item[i].last_update);
        test_data.item[i].pubdate = new Date(test_data.item[i].pubdate);
    }
};

module.exports.insertTestData = function (done) {
    var conn = mongoConn.connection,
        insert_res = conn.call('collection', 'feeds').call('insertManyAsync', test_data.meta);

    var p1 = Promise.each(insert_res.get('ops'), function (meta, i) {
        test_data.meta[i]._id = test_data.item[i].meta_id = meta._id;
    });

    var p2 = p1.then(function () {
        return conn.call('collection', 'posts').call('insertManyAsync', test_data.item);
    });

    var p3 = mongoConn.content.call('insertOneAsync', test_data.content)
    .then(function (insert_res) {
        test_data.content._id = insert_res.ops[0]._id;
    });

    var p4 = Promise.each(p2.get('ops'), function (item, i) {
        test_data.item[i]._id = item._id;
    });

    Promise.join(p3, p4, done);
};

module.exports.deleteTestData = function (done) {
    var conn = mongoConn.connection;
    Promise.all([
        conn.call('collection', 'feeds').call('deleteManyAsync', {}),
        conn.call('collection', 'posts').call('deleteManyAsync', {}),
        conn.call('collection', 'content').call('deleteManyAsync', {})
    ])
    .done(done);
};

module.exports.resetSpies = function () {
    this.spyRes.json.calls.reset();
    this.spyRes.status.calls.reset();
    this.spyRes.set.calls.reset();
    this.spyRes.end.calls.reset();
    this.spyRes.send.calls.reset();
    this.spyRes.type.calls.reset();
};

module.exports.clearListner = function () {
    this.spyRes.events.removeAllListeners();
};

module.exports.makeResSpy = function () {
    this.spyRes = jasmine.createSpyObj('res', ['json', 'status', 'end', 'set', 'redirect', 'send', 'type']);
    this.spyRes.status.and.returnValue(this.spyRes);
    this.spyRes.set.and.returnValue(this.spyRes);
    this.spyRes.type.and.returnValue(this.spyRes);
    this.spyRes.events = new events.EventEmitter();
    this.spyRes.json.and.callFake(emitResponseComplete);
    this.spyRes.end.and.callFake(emitResponseComplete);
    this.spyRes.redirect.and.callFake(emitResponseComplete);
    this.spyRes.send.and.callFake(emitResponseComplete);

    var self = this;
    function emitResponseComplete () {
        setTimeout(self.spyRes.events.emit.bind(self.spyRes.events, 'responseComplete'), 0);
        return self.spyRes;
    }
};
