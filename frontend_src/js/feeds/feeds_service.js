angular.module('reader.feeds')
.factory('feedService', ['$http', '$q', function ($http, $q) {
    var meta_data = [],
        items = [],
        loaded = $q.defer();

    // Load some data initally
    $http.get('api').then(function (res) {
        var i;
        meta_data = res.data.meta;
        for (i=0; i<res.data.items.length; i++) {
            decorateItem(res.data.items[i]);
        }
        items = res.data.items;
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
        loaded: function () { return loaded.promise; }
    };
    
    function decorateItem(item) {
        item.markAsRead = function (read) {
            item.read = read;
            $http.put(item.apiurl, {read: read});
        };
    }
    
}]);
