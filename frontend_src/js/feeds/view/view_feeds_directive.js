angular.module('reader.feeds.view')
.directive('readerViewFeeds', ['feedService', function (fs) {
    return {
        templateUrl: 'js/viewFeeds.html',
        scope: {onSelect: '&'},
        restrict: 'AE',
        require: '^readerView',
        link: function ($scope, $element, $attr, readerCtrl) {
            $scope.list = fs.getFeedMetaList;
            $scope.select = function (apiurl) {
                readerCtrl.selectFeed(apiurl);
                $scope.onSelect({apiurl: apiurl});
            };
            $scope.selected = function (apiurl) {
                return readerCtrl.isSelected(apiurl);
            };
        }
    };
}]);
