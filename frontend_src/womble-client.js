(function () {
    "use strict";
    
    var wombleApp = angular.module('wombleApp', ['reader.xsrf', 'reader.user']);
    
    wombleApp.factory('wombleService', ['$http', function ($http) {
        var meta_data = [];
        var items = [];
        
        // Load some data initally
        $http.get('api').then(function (res) {
            var i;
            meta_data = res.data.meta;
            for (i=0; i<res.data.items.length; i++) {
                decorateItem(res.data.items[i]);
            }
            items = res.data.items;
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
            }
        };
        
        function decorateItem(item) {
            item.markAsRead = function (read) {
                item.read = read;
                $http.put(item.apiurl, {read: read});
            };
        }
        
    }]);
    
    wombleApp.controller('wombleCtrl', ['wombleService', '$window', function (ws, $window) {
        this.feedData = {
            meta: ws.getFeedMetaList,
            items: ws.getFeedItems
        };
        
        this.selectItem = function (post) {
            post.markAsRead(true);
            $window.open(post.link, '_blank');
        };
        
    }]);

    wombleApp.controller('AddFeedCtrl', ['wombleService', function (ws) {
        this.addNew = function (url) {
            ws.addNew(url);
        };
    }]);
    
})();
