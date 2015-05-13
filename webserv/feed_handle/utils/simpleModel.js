var Promise = require('bluebird');


var augment = function (collection, result) {
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
                return collection.updateOneAsync(q, {$set: set});
            }
        },
        _id: {
            enumerable: false,
            configurable: false,
            writable: false
        }
    });
    return result;
}
module.exports = function (collection) {
    return {
        find: function (q, opt) {
            return collection.findOneAsync(q, opt)
            .then(augment.bind(null, collection));
        }
    };
};