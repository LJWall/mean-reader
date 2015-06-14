(function () {
    "use strict";
    
    var wombleApp = angular.module('wombleApp', ['reader.xsrf', 'reader.user', 'reader.feeds']);
    
    wombleApp.controller('wombleCtrl', ['feedService', '$window', function (fs, $window) {
        this.feedData = {
            meta: fs.getFeedMetaList,
            items: fs.getFeedItems
        };

        this.selectItem = function (post) {
            post.markAsRead(true);
            $window.open(post.link, '_blank');
        };

        /*  Temporyry addition while refactoring... */
        var self = this;
        this.selectFeed = function (apiurl) {
            self.selected = apiurl;
        };
    }]);
})();
