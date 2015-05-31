(function () {

var ME_URL = '/reader/auth/me';

angular.module('reader.user', [])
.run(['$http', function ($http) {
    var me = $http.get(ME_URL);
    me.then(function (data) {
        console.log(data);
    } );
    //return {
    //    me: function () { return me; }
    //};
}]);

})();
