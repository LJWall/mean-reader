angular.module('reader.feeds')
.directive('readerAddFeedForm', [function (feedService) {
    return {
        templateUrl: 'js/add.html',
        restrict: 'AE',
        scope: {
            'add': '&'
        },
        link: function ($scope) {
            $scope.messages = [];
            $scope.addNew = function (url) {
                var newMsg = {
                    'text': 'Adding ' + url,
                    'class': 'alert alert-info'
                };
                $scope.messages.push(newMsg);
                console.log($scope.messages);
                $scope.add({url: url})
                .then(function (feedData) {
                    newMsg.text = 'Added ' + feedData.title;
                    newMsg.class = 'alert alert-success';
                    $scope.newFeedURL = undefined;
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
