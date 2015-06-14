angular.module('reader.feeds.view')
.directive('readerView', [function () {
    return {
        template: '<div ng-transclude></div>',
        transclude: true,
        retrict: 'AE',
        controller: ['$scope', function ($scope) {
            var selected;
            this.selectFeed = function (apiurl) {
                selected = apiurl;
            };
            this.isSelected = function (apiurl) {
                return selected===apiurl;
            };
            this.selected = function () {
                return selected;
            };
        }]
    };
}]);
