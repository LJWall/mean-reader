angular.module('reader.feeds')
.directive('readerViewItems', [function () {
    return {
        templateUrl: 'js/viewItems.html',
        scope: {
            itemList: '=',
            isMore: '=',
            getMore: '&'
        },
        restrict: 'AE',
        link: function ($scope) {
            $scope.await=false;
            $scope.infScrollGetMore = function () {
                if (!$scope.await) {
                    $scope.await = true;
                    $scope.getMore()
                    .then(function () {
                        $scope.await = false;
                    });
                }
            };
            $scope.$watch('itemList', function (after, before) {
                $scope.$emit('itemListChange');
            });
        }
    };
}]);
