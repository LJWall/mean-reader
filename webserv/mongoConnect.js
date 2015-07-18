var Promise = require('bluebird'),
    mongodb = require('mongodb'),
    config = require('./config.js'),
    db_promise,
    MongoClient = Promise.promisifyAll(mongodb.MongoClient);

Promise.promisifyAll(mongodb.Collection.prototype);
Promise.promisifyAll(mongodb.Cursor.prototype);

// Export connection promise
module.exports.connection = db_promise = MongoClient.connectAsync(config.mongo_uri);

// For convenience, export collection promises with some utilities ready defined
['users', 'feeds', 'posts', 'content'].forEach(function (coll_name) {
    module.exports[coll_name] = db_promise.call('collection', coll_name);
    module.exports[coll_name].find = find;
    module.exports[coll_name].findOneAsync = findOneAsync;
});

module.exports.disconnect = function () {
    db_promise.call('close');
};

function findOneAsync (query) {
    return this.call('findOneAsync', query);
}

function toArrayAsync () {
    return decorate_cursor(this.call('toArrayAsync'));
}

function sort (sort_obj) {
    return decorate_cursor(this.call('sort', sort_obj));
}

function limit (N) {
    return decorate_cursor(this.call('limit', N));
}

function find (query) {
    return decorate_cursor(this.call('find', query));
}

function decorate_cursor (cursor) {
    cursor.sort = sort;
    cursor.limit = limit;
    cursor.toArrayAsync = toArrayAsync;
    return cursor;
}
