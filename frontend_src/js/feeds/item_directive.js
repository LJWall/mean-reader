angular.module('reader.feeds')
.directive('readerItem', ['$window', '$sce', function ($window, $sce) {
    return {
        templateUrl: 'js/item.html',
        scope: {
            item: '=',
        },
        restrict: 'AE',
        link: function ($scope) {
            $scope.show_content = false;
            $scope.show = function () {
                $scope.show_content = !$scope.show_content;
                if ($scope.show_content) {
                    $scope.item.markAsRead(true);
                    if (!$scope.item.content_apiurl) {
                        $scope.content = $sce.trustAsHtml('<h3><a href="' + $scope.item.link + '" target="_blank">' + $scope.item.title + '</a></h3>');
                    } else {
                        $scope.content = $sce.trustAsHtml('<h3><i class="fa fa-circle-o-notch fa-spin"></i> loading </h3>');
                        $scope.item.getContent()
                        .then(function (content) {
                            $scope.content = $sce.trustAsHtml(content);
                        })
                        .then(null, function (err) {
                            $scope.content = $sce.trustAsHtml('<h3>Problem getting content</h3>');
                        });
                    }
                }
            };
            $scope.checkItem = function () {
                $scope.item.checked = !$scope.item.checked;
            };
            $scope.linkOut = function () {
                $scope.item.markAsRead(true);
                $window.open($scope.item.link, '_blank');
            };
        }
    };
}]);
