angular.module('reader.feeds.view')
.directive('readerViewItems', ['feedService', '$window', function (fs, $window) {
    return {
        templateUrl: 'js/viewItems.html',
        scope: {
            itemList: '=',
            itemFilter: '=',
            viewItem: '&'
        },
        restrict: 'AE'
    };
}]);
