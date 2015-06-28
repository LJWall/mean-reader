angular.module('reader.feeds')
.directive('readerAddFeedForm', ['feedService', function (feedService) {
    return {
        templateUrl: 'js/add.html',
        restrict: 'AE',
        scope: {},
        link: function ($scope) {
            $scope.addNew = function (url) {
                $scope.alertmsg = null;
                feedService.addNew(url)
                .then(null, function () {
                    $scope.alertmsg = 'Hmmm.  Theres seems to be a problem with ' + url +
                        '. Maybe try again a bit later. ' +
                        'If it still doesn\'t work drop an email to ljw.dev@gmail.com.';
                });
            };
         }
    };
}]);
