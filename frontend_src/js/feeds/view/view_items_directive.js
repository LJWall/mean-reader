angular.module('reader.feeds.view')
.directive('readerViewItems', ['feedService', '$window', function (fs) {
    return {
        templateUrl: 'js/viewItems.html',
        scope: {},
        restrict: 'AE',
        require: '^readerView',
        link: function ($scope, $element, $attr, readerCtrl) {
            $scope.items = fs.getFeedItems;
            $scope.selected = readerCtrl.selected;
            $scope.selectItem = function (item) {
                post.markAsRead(true);
                $window.open(post.link, '_blank');
            };
        }
    };
}]);
