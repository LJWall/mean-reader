(function () {

angular.module('reader.xsrf', [])
.factory('token_state', ['$q', function ($q) {
    var done = $q.defer();
    return {
        done: function () { return done; },
        request: function (config) {
            if (config.url === '/reader/api/get_xsrf_token') {
                return config;
            } else {
                return done.promise.then(function () { return config; });
            }
        }
    };
}])
.run(['$http', 'token_state', function ($http, token_state) {
    var GET_TOKEN_URL = '/reader/api/get_xsrf_token';
    $http.get(GET_TOKEN_URL)
    .success(function () {
        token_state.done().resolve(true);
    })
    .error(function () {
        token_state.done().reject();
    });
}])
.config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push('token_state');
}]);

})();
