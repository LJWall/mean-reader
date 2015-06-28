angular.module('reader.feeds')
.factory('feedService', ['$http', 'currentUserService', 'apiRoot', 'getMoreNumber', function ($http, userService, apiRoot, getMoreNumber) {
    var meta_data = [],
        items = [],
        last_modified,
        meta_data_map,
        item_map,
        feedOldestItem = {},
        feedIsMore = {};

    // Load some data initally
    $http.get(apiRoot, {params: {N: getMoreNumber}}).then(function (res) {
        processItemDates(res.data);
        meta_data = res.data.meta;
        items = res.data.items;
        meta_data_map = buildMap(meta_data);
        item_map = buildMap(items);
        last_modified = res.headers('last-modified');
        feedIsMore[apiRoot] = true;
        meta_data.forEach(function (feedData) {
            feedIsMore[feedData.apiurl] = true;
        });
        items.forEach(function (item, i) {
            if (!feedOldestItem[item.meta_apiurl] || feedOldestItem[item.meta_apiurl].getTime() > item.pubdate.getTime()) {
                feedOldestItem[item.meta_apiurl] = item.pubdate;
            }
            if (i) {
                feedOldestItem[apiRoot] = (item.pubdate.getTime() < feedOldestItem[apiRoot].getTime() ? item.pubdate : feedOldestItem[apiRoot]);
            } else {
                feedOldestItem[apiRoot] = item.pubdate;
            }
        });
    });

    userService.onSignOut(function () {
        meta_data = [];
        items = [];
    });

    return {
        getFeedMetaList: function () {
            return meta_data;
        },
        getFeedItems: function () {
            return items;
        },
        addNew: function (url) {
            return $http.post('api/feeds', {feedurl: url}).then(function (res) {
                processItemDates(res.data);
                workInNewData(res.data);
            });
        },
        markAsRead: function (item, read) {
            item.read = read;
            $http.put(item.apiurl, {read: read});
        },
        updateData: updateData,
        isMore: function () {
            return feedIsMore;
        },
        oldestItem: function () {
            return feedOldestItem;
        },
        getMore: getMore
    };

    function getMore(apiurl) {
        var config = {params: {N: getMoreNumber}};
        if (feedOldestItem[apiurl]) {
            config.params.older_than = feedOldestItem[apiurl].toString();
        }
        return $http.get(apiurl, config)
        .then(function (res) {
            processItemDates(res.data);
            workInNewData(res.data);
            if (res.data.items.length < getMoreNumber) {
                feedIsMore[apiurl]=false;
            }
            res.data.items.forEach(function (item) {
                if (!feedOldestItem[apiurl] || feedOldestItem[apiurl].getTime() > item.pubdate.getTime()) {
                    feedOldestItem[apiurl] = item.pubdate;
                }
            });
            if (apiurl === apiRoot) {
                res.data.items.forEach(function (item) {
                    if (!feedOldestItem[item.meta_apiurl] || feedOldestItem[item.meta_apiurl].getTime() > item.pubdate.getTime()) {
                        feedOldestItem[item.meta_apiurl] = item.pubdate;
                    }
                });
            }
        });
    }

    function updateData () {
        var config;
        if (last_modified) {
            config = {params: {updated_since: last_modified}};
        }
        return $http.get('api', config)
        .then(function (res) {
            last_modified = res.headers('last-modified');
            processItemDates(res.data);
            workInNewData(res.data);
        });
    }

    function workInNewData(data) {
        data.meta.forEach(function (metaObj) {
            if (angular.isDefined(meta_data_map[metaObj.apiurl])) {
                meta_data[meta_data_map[metaObj.apiurl]] = metaObj;
            } else {
                meta_data.push(metaObj);
                meta_data_map[metaObj.apiurl] = meta_data.length - 1;
            }
        });
        data.items.forEach(function (itemObj) {
            if (angular.isDefined(item_map[itemObj.apiurl])) {
                items[item_map[itemObj.apiurl]] = itemObj;
            } else {
                items.push(itemObj);
                item_map[itemObj.apiurl] = items.length - 1;
            }
        });
    }

    function processItemDates (data) {
        data.items.forEach(function (item) {
            item.pubdate = new Date(item.pubdate);
        });
    }

    function buildMap (list) {
        return list.reduce(function (prev, cur, i) {
            prev[cur.apiurl] = i;
            return prev;
        }, {});
    }
}]);
