
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
    var f = augment.bind(null, collection);
    return {
        findOne: function (q) {
            return collection.findOneAsync(q)
            .then(f);
        },
        findMany: function (q, sort, num) {
            var cursor = collection.find(q);
            if (sort) { cursor = cursor.sort(sort); }
            if (num) { cursor = cursor.limit(num); }
            return cursor.toArrayAsync().map(f);
        }
    };
};
