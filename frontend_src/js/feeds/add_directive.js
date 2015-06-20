angular.module('reader.feeds')
.directive('readerAddFeedForm', ['feedService', function (feedService) {
    return {
        templateUrl: 'js/add.html',
        restrict: 'AE',
        scope: {},
        link: function ($scope) {
            $scope.addNew = function (url) {
                feedService.addNew(url); 
            };
         }
    };
}]);
