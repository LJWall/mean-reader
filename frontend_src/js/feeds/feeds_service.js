angular.module('reader.feeds')
.factory('feedService', ['$http', '$q', function ($http, $q) {
    var meta_data = [],
        items = [],
        last_modified,
        meta_data_map,
        item_map,
        loaded = $q.defer();

    // Load some data initally
    $http.get('api').then(function (res) {
        var i;
        meta_data = res.data.meta;
        items = res.data.items;
        meta_data_map = buildMap(meta_data);
        item_map = buildMap(items);
        last_modified = res.headers('last-modified');
        loaded.resolve(true);
    });

    return {
        getFeedMetaList: function () {
            return meta_data;
        },
        getFeedItems: function () {
            return items;
        },
        addNew: function (url) {
            var i;
            $http.post('api/feeds', {feedurl: url}).then(function (res) {
                meta_data.push(res.data.meta[0]);
                for (i=0; i<res.data.items.length; i++) {
                    decorateItem(res.data.items[i]);
                }
                items = items.concat(res.data.items);
            });
        },
        markAsRead: function (item, read) {
            item.read = read;
            $http.put(item.apiurl, {read: read});
        },
        updateData: updateData,
        loaded: function () { return loaded.promise; }
    };

    function updateData () {
        var config = {};
        if (last_modified) {
            config.params = {updated_since: last_modified};
        }
        $http.get('api', config)
        .then(function (res) {
            last_modified = res.headers('last-modified');
            res.data.meta.forEach(function (metaObj) {
                if (angular.isDefined(meta_data_map[metaObj.apiurl])) {
                    meta_data[meta_data_map[metaObj.apiurl]] = metaObj;
                } else {
                    meta_data.push(metaObj);
                    meta_data_map[metaObj.apiurl] = meta_data.length - 1;
                }
            });
            res.data.items.forEach(function (itemObj) {
                if (angular.isDefined(item_map[itemObj.apiurl])) {
                    items[item_map[itemObj.apiurl]] = itemObj;
                } else {
                    items.push(itemObj);
                    item_map[itemObj.apiurl] = items.length - 1;
                }
            });
        });
    }

    function buildMap (list) {
        return list.reduce(function (prev, cur, i) {
            prev[cur.apiurl] = i;
            return prev;
        }, {});
    }
}]);
