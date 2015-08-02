angular.module('reader.feeds')
.directive('readerViewFeeds', [function (fs) {
    return {
        templateUrl: 'js/viewFeeds.html',
        scope: {
            feedTree: '=',
            highlightFeed: '=',
            deleteFeed: '&',
            viewFeed: '&'
        },
        restrict: 'AE'
    };
}]);
