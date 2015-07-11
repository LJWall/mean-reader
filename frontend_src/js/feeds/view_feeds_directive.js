angular.module('reader.feeds')
.directive('readerViewFeeds', ['feedService', function (fs) {
    return {
        templateUrl: 'js/viewFeeds.html',
        scope: {
            feedList: '=',
            highlightFeed: '=',
            deleteFeed: '&',
            viewFeed: '&'
        },
        restrict: 'AE'
    };
}]);
