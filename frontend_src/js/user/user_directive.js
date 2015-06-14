angular.module('reader.user')
.directive('readerLogin', ['currentUserService', function (currentUser) {
    return {
        templateUrl: 'js/user.html',
        restrict: 'AE',
        scope: {},
        link: function ($scope) {
            $scope.data = function () {return currentUser.data(); };
            $scope.isAuthenticated = function () {return currentUser.isAuthenticated(); };
            $scope.logout = function () {return currentUser.logout(); };

         }
    };
}]);

