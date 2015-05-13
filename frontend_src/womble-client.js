(function () {
    "use strict";
    
    var wombleApp = angular.module('wombleApp', []);
    
    wombleApp.factory('wombleService', ['$http', function ($http) {
        var meta_data = [];
        var items = [];
        
        // Load all the data initally
        $http.get('/reader').then(function (res) {
            meta_data = res.data.meta;
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
                $http.post('/reader/feeds', {feedurl: url}).then(function (res) {
                    meta_data.push(res.data.meta);
                    items = items.concat(res.data.items);
                });
            }
        };
    }]);
    
    wombleApp.controller('wombleCtrl', ['wombleService', function (ws) {
        var self = this;
        
        self.feedData = {
            meta: ws.getFeedMetaList,
            items: ws.getFeedItems
        };
        
        self.selectItem = function (post) {
            post.read = true;
            window.open(post.link, '_blank');
        };
        
        self.addNew = function (url) {
            ws.addNew(url)
        };
    }]);
    
})();