angular.module('reader.feeds')
.directive('readerViewItems', [function () {
    return {
        templateUrl: 'js/viewItems.html',
        scope: {
            itemList: '=',
            itemFilter: '=',
            isMore: '=',
            getMore: '&'
        },
        restrict: 'AE',
        link: function ($scope) {
            $scope.await=false;
            $scope.infScrollGetMore = function () {
                $scope.await = true;
                $scope.getMore()
                .then(function () {
                    $scope.await = false;
                });
            };
            $scope.$watch('itemFilter', function (after, before) {
                $scope.$emit('itemFilterChange');
            }, true);
        }
    };
}]);
