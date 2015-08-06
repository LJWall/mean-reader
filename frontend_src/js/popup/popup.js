angular.module('reader.popup', ['ui.bootstrap'])

.factory('readerPopup', ['$modal', function ($modal) {
    return function (data) {
        var modalInstance = $modal.open({
            animation: true,
            templateUrl: 'js/popup.html',
            controller: 'popupCtrl',
            //size: size,
            resolve: {
                data: function () {
                    return data;
                }
            }
        });
        return modalInstance.result;
    };
}])

.controller('popupCtrl', ['$scope', 'data', function ($scope, data) {
    $scope.title = data.title;
    $scope.label = data.label;
    $scope.newText = data.initText;
    $scope.okText = data.okText;
}]);
