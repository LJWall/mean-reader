angular.module('reader.feeds.view')
.directive('readerViewItems', ['feedService', '$window', function (fs, $window) {
    return {
        templateUrl: 'js/viewItems.html',
        scope: {},
        restrict: 'AE',
        require: '^readerView',
        link: function ($scope, $element, $attr, readerCtrl) {
            $scope.items = fs.getFeedItems;
            $scope.selected = readerCtrl.selected;
            $scope.selectItem = function (item) {
                item.markAsRead(true);
                $window.open(item.link, '_blank');
            };
        }
    };
}]);
