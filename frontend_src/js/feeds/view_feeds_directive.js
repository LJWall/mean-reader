angular.module('reader.feeds')
.directive('readerViewFeeds', [function (fs) {
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
