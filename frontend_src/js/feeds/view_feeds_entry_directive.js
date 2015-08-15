angular.module('reader.feeds')
.directive('readerViewFeedsEntry', ['readerPopup', function (readerPopup) {
    return {
        templateUrl: 'js/viewFeedsEntry.html',
        restrict: 'E'
    };
}]);
