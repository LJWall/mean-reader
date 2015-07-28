angular.module('readerApp')
.controller('ReaderCtrl', ['currentUserService', 'feedService', 'apiRoot', function (user, fs, apiRoot) {
    var selected = fs.feedTree();

    this.itemFilter = {};
    this.updating = false;

    this.feedList = function () {
        return fs.feedTree().branches;
    };

    this.displayedFeed = function () {
        return selected.apiurl;
    };

    this.itemsList = function () {
        return fs.getFeedItems();
    };

    this.viewFeed = function (feedObj) {
        if (selected === feedObj) {
            selected = fs.feedTree();
            this.itemFilter = {};
        }
        else {
            this.itemFilter.meta_apiurl = feedObj.apiurl;
            selected = feedObj;
        }
    };

    this.deleteFeed = fs.deleteFeed;

    var self=this;
    this.updateData = function () {
        this.updating = true;
        fs.updateData()
        .then(done, done);
        function done () {self.updating = false;}
    };

    this.isMore = function () {
        return !!fs.isMore()[selected.apiurl];
    };

    this.getMore = function () {
        return selected.getMore();
    };

    this.isUserAuthenticated = function () {
        return user.isAuthenticated();
    };

    this.markAllAsRead = function () {
        fs.markAllAsRead(selected.apiurl);
    };

    this.anyChecked = function () {
        var i,
            items = fs.getFeedItems();
        for (i=0; i < items.length; i++) {
            if (items[i].checked) {
                return true;
            }
        }
        return false;
    };

    this.markAsRead = function (read) {
        fs.getFeedItems().forEach(function (item) {
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
        fs.getFeedItems().forEach(function (item) {
            item.checked = false;
        });
    };
}]);
