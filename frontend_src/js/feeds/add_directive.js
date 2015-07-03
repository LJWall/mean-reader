angular.module('reader.feeds')
.directive('readerAddFeedForm', ['feedService', function (feedService) {
    return {
        templateUrl: 'js/add.html',
        restrict: 'AE',
        scope: {},
        link: function ($scope) {
            $scope.messages = [];
            $scope.addNew = function (url) {
                var newMsg = {
                    'text': 'Adding ' + url,
                    'class': 'alert alert-info'
                };
                $scope.messages.push(newMsg);
                console.log($scope.messages);
                feedService.addNew(url)
                .then(function () {
                    newMsg.text = 'Added ' + url;
                    newMsg.class = 'alert alert-success';
                })
                .catch(function () {
                    newMsg.text = 'Hmmm.  Theres seems to be a problem with ' + url +
                        '. Maybe try again a bit later. ' +
                        'If it still doesn\'t work drop an email to ljw.dev@gmail.com.';
                    newMsg.class = 'alert alert-danger';
                });
            };
         }
    };
}]);
