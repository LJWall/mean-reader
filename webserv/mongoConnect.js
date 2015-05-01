var Promise = require('bluebird'),
    mongodb = require("mongodb"),
    db,
    MongoClient = Promise.promisifyAll(mongodb.MongoClient);

Promise.promisifyAll(mongodb.Collection.prototype);
Promise.promisifyAll(mongodb.Cursor.prototype);

module.exports.uri = 'mongodb://127.0.0.1:27017/meanfeed';

module.exports.connection = function () {
    if (db) {
        return Promise.resolve(db);
    } else {
        return MongoClient.connectAsync(module.exports.uri)
        .then(function(_db) {
            db = _db;
            return db;
        });
    }
};


