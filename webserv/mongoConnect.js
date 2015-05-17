var Promise = require('bluebird'),
    mongodb = require("mongodb"),
    db,
    db_promise,
    MongoClient = Promise.promisifyAll(mongodb.MongoClient),
    openstate = false;

Promise.promisifyAll(mongodb.Collection.prototype);
Promise.promisifyAll(mongodb.Cursor.prototype);

module.exports.uri = 'mongodb://127.0.0.1:27017/meanfeed';

module.exports.connection = function () {
    if (!db_promise) {
        db_promise = MongoClient.connectAsync(module.exports.uri)
        .then(function(_db) {
            db = _db;
            db.on('close', function () {
                db_promise = null;
            });
            return db;
        });
    }
    return db_promise;
};

module.exports.disconnect = function () {
    if (db) {
        db.close();
    }
};



