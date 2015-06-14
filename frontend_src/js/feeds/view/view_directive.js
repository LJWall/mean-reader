angular.module('reader.feeds.view')
.directive('readerView', [function () {
    return {
        template: '<div ng-transclude></div>',
        transclude: true,
        retrict: 'AE'
    };
}]);
