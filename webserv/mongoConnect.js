var Promise = require('bluebird'),
    mongodb = require('mongodb'),
    config = require('./config.js'),
    db_promise,
    MongoClient = Promise.promisifyAll(mongodb.MongoClient);

Promise.promisifyAll(mongodb.Collection.prototype);
Promise.promisifyAll(mongodb.Cursor.prototype);

module.exports.connection = db_promise = MongoClient.connectAsync(config.mongo_uri);

module.exports.disconnect = function () {
    db_promise.call('close');
};


