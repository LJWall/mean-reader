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
        this.itemFilter.meta_apiurl = selected = feedObj.apiurl;
    };

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
            fs.getMore(selected);
        } else {
            fs.getMore(apiRoot);
        }
    };

    this.isUserAuthenticated = function () {
        return user.isAuthenticated();
    };
}]);
