angular.module('reader.feeds')
.directive('readerViewFeeds', ['readerPopup', function (readerPopup) {
    return {
        templateUrl: 'js/viewFeeds.html',
        scope: {
            feedTree: '=',
            highlightFeed: '=',
            deleteFeed: '&',
            viewFeed: '&'
        },
        restrict: 'AE',
        link: function ($scope) {
            $scope.feedTree.showBranches = true;
            $scope.rename = function (treeNode) {
                readerPopup({
                    //title: 'Rename',
                    label: 'New name',
                    initText: treeNode.userTitle || treeNode.title,
                    okText: 'Rename'
                })
                .then(function (result) {
                    if (result) {
                        treeNode.setUserTitle(result);
                    }
                });
            };
        }
    };
}]);
