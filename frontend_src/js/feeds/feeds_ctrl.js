angular.module('reader.feeds')
.controller('ReaderCtrl', ['feedService', '$window', function (fs, $window) {
    var selected;

    this.itemFilter = {};

    this.feedList = function () {
        return fs.getFeedMetaList();
    };

    this.displayedFeed = function () {
        return selected;
    };

    this.itemsList = function () {
        return fs.getFeedItems();
    };

    this.viewFeed = function (feedObj) {
        this.itemFilter.meta_apiurl = selected = feedObj.apiurl;
    };

    this.viewItem = function (itemObj) {
        itemObj.markAsRead(true);
        $window.open(itemObj.link, '_blank');
    };

    var self = this;
    fs.loaded().then(function () {
        var meta_list = fs.getFeedMetaList();
        if (meta_list[0]) {
            self.viewFeed(meta_list[0]);
        }
    });
}]);
