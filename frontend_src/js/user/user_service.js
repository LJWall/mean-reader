(function () {

var ME_URL = '/reader/auth/me',
    userData,
    signOutCallbacks = [];

angular.module('reader.user')
.service('currentUserService', ['$http', function ($http) {
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
}])

.factory('currentUserService_resTest', ['$q', function ($q) {
    return {
      responseError: function (res) {
          if (res.status === 401) {
              if (userData) {
                signOutCallbacks.forEach(function (callback) {
                    callback();
                });
              }
              userData = null;
          }
          return $q.reject(res);
      }
    };
}])

.config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push('currentUserService_resTest');
}]);

})();
