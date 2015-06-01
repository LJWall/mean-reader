(function () {

var ME_URL = '/reader/auth/me';

angular.module('reader.user', [])
.service('currentUserService', ['$http', function ($http) {
    var userData;

    activate();

    return {
        data: function () { return userData; },
        isAuthenticated: function () {
            return (userData ? true : false);
        },
        logout: logout
    };

    function activate() {
        updateUser();
    }

    function updateUser() {
        $http.get(ME_URL)
        .success(function (res) {
            userData = res;
        })
        .error(function () {
            userData = null;
        });
    }
    function logout () {
        $http.get('/reader/auth/logout')
        .then(function () {
            updateUser();
        });
    }
}])
.controller('CurrentUserCtrl', ['currentUserService', function (userService) {
    this.data = function () {return userService.data(); };
    this.isAuthenticated = function () {return userService.isAuthenticated(); };
    this.logout = function () {return userService.logout(); };
}])
.directive('readerLogin', [function (currentUser) {
    return {
        template:   '<div ng-controller="CurrentUserCtrl as c">' +
            '<span ng-show="c.isAuthenticated()">{{c.data().displayName}} ' +
            '<a href ng-click="c.logout()">Log out</a>' +
            '</span>' +
            '<span ng-show="!c.isAuthenticated()"><a href="/reader/auth/google">Log in with Google</a></span>' +
            '</div>',
        restrict: 'AE',
        scope: {}
    };
}]);

})();
