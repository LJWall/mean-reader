(function () {

var ME_URL = '/reader/auth/me';

angular.module('reader.user')
.service('currentUserService', ['$http', function ($http) {
    var userData, signOutCallbacks = [];

    updateUser();

    return {
        data: function () { return userData; },
        isAuthenticated: function () {
            return (userData ? true : false);
        },
        logout: logout,
        onSignOut: onSignOut
    };

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
        signOutCallbacks.forEach(function (callback) {
            callback();
        });
    }
    function onSignOut (callback) {
        signOutCallbacks.push(callback);
    }
}]);

})();
