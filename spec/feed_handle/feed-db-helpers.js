var Promise = require('bluebird'),
    mongoConn = require('../../webserv/mongoConnect.js'),
    ObjectID = require('mongodb').ObjectID,
    mongodb;
    
    
// sample data
module.exports.sampledata = []
module.exports.sampledata.push({
    meta: {_id: new ObjectID('000000000000000000000001'), link: 'url', feedurl: 'feedurl', title: 'blog'},
    items: [{guid: '1', title: 'A', link: 'linkA'}, {guid: '2', title: 'B', link: 'linkB'}]
});
module.exports.sampledata[0].items[0].meta_id = module.exports.sampledata[0].meta._id;
module.exports.sampledata[0].items[1].meta_id = module.exports.sampledata[0].meta._id;

module.exports.sampledata.push({
    meta: {_id: new ObjectID('000000000000000000000002'), link: 'url2', feedurl: 'feedurl2', title: 'blog2'},
    items: [{guid: '1', title: 'A', link: 'linkA2'}, {guid: '2', title: 'B', link: 'linkB2'}]
});
module.exports.sampledata[1].items[0].meta_id = module.exports.sampledata[1].meta._id;
module.exports.sampledata[1].items[1].meta_id = module.exports.sampledata[1].meta._id;


module.exports.clearTestDb = function () {
    return Promise.all([
        mongodb.collection('posts').deleteManyAsync({}),
        mongodb.collection('feeds').deleteManyAsync({})
    ]);
};

module.exports.setupTestDb = function () {
    return mongoConn.connection()
    .then(function(db) {
        mongodb = db;
        return db;
    })
    .then(module.exports.clearTestDb);
};
module.exports.closeTestDb = function () {
    if (mongodb) {
        mongodb.close();
    }
    
};

module.exports.insertSample = function (i) {
    return Promise.all([
        mongodb.collection('feeds').insertOneAsync(module.exports.sampledata[i].meta),
        mongodb.collection('posts').insertManyAsync(module.exports.sampledata[i].items)
    ]);
};


