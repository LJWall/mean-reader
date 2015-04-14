(function () {
    "use strict";
    
    var wombleApp = angular.module('wombleApp', []);
    
    wombleApp.factory('wombleService', ['$http', function ($http) {
        return {
            postFeedUri: function (feedURI) {
                console.log(feedURI);
                $http.post('/womble', {feed_url: feedURI})
                    .then(function () {console.log('Got results')}, function (err) {console.log('Error: ', err)});
            }
        };
    }]);
    
    wombleApp.controller('wombleCtrl', ['wombleService', function (ws) {
        var self = this;
        
        self.postFeedUri = function (newFeedURI) {
            ws.postFeedUri(newFeedURI);
        };
    }]);
    
})();