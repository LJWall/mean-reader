var Promise = require('bluebird'),
    mongodb = require('mongodb'),
    config = require('./config.js'),
    db,
    db_promise,
    MongoClient = Promise.promisifyAll(mongodb.MongoClient),
    openstate = false;

Promise.promisifyAll(mongodb.Collection.prototype);
Promise.promisifyAll(mongodb.Cursor.prototype);

module.exports.connection = function () {
    if (!db_promise) {
        db_promise = MongoClient.connectAsync(config.mongo_uri)
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



