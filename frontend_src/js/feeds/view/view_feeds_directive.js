angular.module('reader.feeds.view')
.directive('readerViewFeeds', ['feedService', function (fs) {
    return {
        templateUrl: 'js/viewFeeds.html',
        scope: {onSelect: '&'},
        restrict: 'AE',
        link: function ($scope) {
            var selected;
            $scope.list = fs.getFeedMetaList;
            $scope.select = function (apiurl) {
                selected = apiurl;
                $scope.onSelect({apiurl: apiurl});
            };
            $scope.selected = function (apiurl) {
                return (selected===apiurl);
            };
        }
    };
}]);
