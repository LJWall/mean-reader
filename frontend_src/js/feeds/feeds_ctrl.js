angular.module('reader.feeds')
.controller('ReaderCtrl', ['currentUserService', 'feedService', '$window', 'apiRoot', function (user, fs, $window, apiRoot) {
    var selected;

    this.itemFilter = {};
    this.updating = false;

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
        if (selected === feedObj.apiurl) {
            selected = undefined;
            this.itemFilter = {};
        }
        else {
            this.itemFilter.meta_apiurl = feedObj.apiurl;
            selected = feedObj.apiurl;
        }
    };

    this.deleteFeed = fs.deleteFeed;

    this.viewItem = function (itemObj) {
        fs.markAsRead(itemObj, true);
        $window.open(itemObj.link, '_blank');
    };

    var self=this;
    this.updateData = function () {
        this.updating = true;
        fs.updateData()
        .then(done, done);
        function done () {self.updating = false;}
    };

    this.isMore = function () {
        if (selected) {
            return !!fs.isMore()[selected];
        } else {
            return !!fs.isMore()[apiRoot];
        }
    };

    this.getMore = function () {
        if (selected) {
            return fs.getMore(selected);
        }
        return fs.getMore(apiRoot);
    };

    this.isUserAuthenticated = function () {
        return user.isAuthenticated();
    };

    this.markAllAsRead = function () {
        fs.markAllAsRead(selected);
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
                fs.markAsRead(item, read);
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
