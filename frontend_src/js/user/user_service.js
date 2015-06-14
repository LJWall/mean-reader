(function () {

var ME_URL = '/reader/auth/me';

angular.module('reader.user')
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
}]);

})();
