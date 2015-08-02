angular.module('readerApp')
.controller('ReaderCtrl', ['currentUserService', 'feedService', 'apiRoot', function (user, fs, apiRoot) {
    var selected = fs.feedTree();

    this.itemFilter = {};
    this.updating = false;

    this.feedTree = function () {
        return fs.feedTree();
    };

    this.displayedFeed = function () {
        return selected.apiurl;
    };

    this.itemsList = function () {
        return selected.items();
    };

    this.viewFeed = function (feedObj) {
        selected = feedObj;
    };

    this.deleteFeed = function (feedObj) {
        if (feedObj === selected) {
            selected = fs.feedTree();
        }
        feedObj.delete();
    };

    var self=this;
    this.updateData = function () {
        this.updating = true;
        fs.refresh()
        .then(done, done);
        function done () {self.updating = false;}
    };

    this.isMore = function () {
        return selected.isMore();
    };

    this.getMore = function () {
        return selected.getMore();
    };

    this.isUserAuthenticated = function () {
        return user.isAuthenticated();
    };

    this.markAllAsRead = function () {
        selected.markAllAsRead();
    };

    this.anyChecked = function () {
        var i;
        for (i=0; i < selected.items().length; i++) {
            if (selected.items()[i].checked) {
                return true;
            }
        }
        return false;
    };

    this.markAsRead = function (read) {
        selected.items().forEach(function (item) {
            if (item.checked) {
                item.checked = false;
                item.markAsRead(read);
            }
        });
    };

    this.addFeed = function(url) {
        var self=this;
        return fs.addNew(url).then(function(feedData) {
            self.viewFeed(feedData);
            return feedData;
        });
    };

    this.uncheckAll = function () {
        selected.items().forEach(function (item) {
            item.checked = false;
        });
    };
}]);
