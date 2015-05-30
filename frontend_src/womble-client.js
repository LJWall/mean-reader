(function () {
    "use strict";
    
    var wombleApp = angular.module('wombleApp', ['reader.xsrf']);
    
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
                $http.post('api/feeds', {feedurl: url}).then(function (res) {
                    meta_data.push(res.data.meta[0]);
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
        var self = this;
        
        self.feedData = {
            meta: ws.getFeedMetaList,
            items: ws.getFeedItems
        };
        
        self.selectItem = function (post) {
            post.markAsRead(true);
            $window.open(post.link, '_blank');
        };
        
        self.addNew = function (url) {
            ws.addNew(url);
        };
    }]);
    
})();
