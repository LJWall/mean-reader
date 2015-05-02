(function () {
    "use strict";
    
    var wombleApp = angular.module('wombleApp', []);
    
    wombleApp.factory('wombleService', ['$http', function ($http) {
        var feed_data;
        return {
            postFeedUri: function (feedURI) {
                console.log(feedURI);
                $http.post('/womble', {feed_url: feedURI})
                    .then(function (res) {console.log('Got results'); feed_data = res.data;},
                          function (err) {console.log('Error: ', err)});
            },
            getFeedData: function () {
                if (!feed_data) {
                    feed_data = $http.get('/womble')
                                    .then(function (res) {console.log('Got results: ', res.data); return res.data;});
                }
                return feed_data;
            }
        };
    }]);
    
    wombleApp.controller('wombleCtrl', ['wombleService', function (ws) {
        var self = this;
        
        self.feedData = {meta: []};
        self.updateDate = function () {
            return ws.getFeedData().then(function (data) {
                self.feedData = data;
            });
        };
        
        self.updateDate().then(function () {
            if (self.feedData.meta[0]) {
                self.selected = self.feedData.meta[0].feedurl;
            }
            
        });
        
        self.selectItem = function (post) {
            post.read = true;
            window.open(post.link, '_blank');
        };
    }]);
    
})();