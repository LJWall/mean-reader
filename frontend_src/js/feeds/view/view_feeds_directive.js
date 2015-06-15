angular.module('reader.feeds.view')
.directive('readerViewFeeds', ['feedService', function (fs) {
    return {
        templateUrl: 'js/viewFeeds.html',
        scope: {},
        restrict: 'AE',
        require: '^readerView',
        link: function ($scope, $element, $attr, readerCtrl) {
            $scope.list = fs.getFeedMetaList;
            $scope.select = readerCtrl.selectFeed;
            $scope.selected = readerCtrl.isSelected;
        }
    };
}]);
