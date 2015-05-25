var Promise = require('bluebird');

var augment = function (collection, result) {
    if (result) {
        Object.defineProperties(result, {
            save: {
                enumerable: false,
                configurable: false,
                writable: false,
                value: function () {
                    var q = {_id: result._id},
                        set = {};
                    Object.keys(result).forEach(function (key) {
                        set[key] = result[key];
                    });
                    return collection.call('updateOneAsync', q, {$set: set});
                }
            },
            _id: {
                enumerable: false,
                configurable: false,
                writable: false
            }
        });
    }
    return result;
}
module.exports.make = function (collection) {
    var c = Promise.resolve(collection), // be agnostic on passing a collection or a promise of a collection.
        f = augment.bind(null, c);
    return {
        findOne: function (query) {
            return c.call('findOneAsync', query)
            .then(f);
        },
        findMany: function (query, sort, num) {
            var cursor = c.call('find', query);
            if (sort) { cursor = cursor.call('sort', sort); }
            if (num) { cursor = cursor.call('limit', num); }
            return cursor.call('toArrayAsync').map(f);
        }
    };
};
