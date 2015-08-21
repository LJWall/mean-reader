angular.module('reader.feeds.service')
.factory('feedService',
['$http', '$q', 'currentUserService', 'apiRoot', 'getMoreNumber', '$httpParamSerializer', '$window',
function ($http, $q, userService, apiRoot, getMoreNumber, $httpParamSerializer, $window) {
    var last_modified,
        content = {},
        feedTree = treeNode({apiurl: apiRoot, title: 'All'}, undefined, true),
        foo_meta = {},
        foo_items = {};

    function treeNode (data, parent, isFolder) {
        var unread = data.unread || 0,
            isMore = true,
            items = [],
            node_item_map = {};

        return {
            title: data.title,
            userTitle: data.userTitle,
            apiurl: data.apiurl,
            branches: [],
            folder: Boolean(isFolder),
            items: function () {return items;},
            addItem: function (item) {
                if (!node_item_map[item.apiurl]) {
                    node_item_map[item.apiurl] = item;
                    items.push(item);
                }
            },
            clearItems: function () {
                items = [];
                node_item_map = {};
                this.oldest = undefined;
                isMore = true;
            },
            parent: parent,
            isMore: function () {
                return isMore;
            },
            getMore: function () {
                var self = this;
                return getMore(this)
                .then(function (res) {
                    if (res.data.items.length === 0) {
                        isMore = false;
                        return;
                    }
                    res.data.items.forEach(function (item) {
                        var newItem;
                        if (foo_items[item.apiurl]) {
                            foo_items[item.apiurl].update(item);
                            newItem = foo_items[item.apiurl];
                        } else {
                            newItem = new Item(item);
                            foo_items[item.apiurl] = newItem;
                        }
                        self.addItem(newItem);
                        self.oldest = (self.oldest ? min([self.oldest, newItem.pubdate.getTime()]) : newItem.pubdate.getTime());
                    });
                    return res.data;
                });
            },
            setUserTitle: function (userTitle) {
                if (this.folder) {
                    this.title = userTitle;
                    this.branches.forEach(function (node) {
                        node.setFolder(userTitle);
                    });
                }
                else {
                    this.userTitle = userTitle;
                    $http.put(this.apiurl, {userTitle: userTitle});
                }
            },
            setFolder: function (folderName) {
                if (this.folder) {
                    throw new Error('Only applicable to feeds');
                }
                $http.put(this.apiurl, {labels: [folderName]});
            },
            moveFolder: function (folderName) {
              var self = this;
              self.setFolder(folderName);
              self.parent.branches = self.parent.branches.filter(function (node) {
                  return node !== self;
              });
              self.parent.clearItems();
              self.parent = folder(folderName);
              self.parent.branches.push(self);
              self.parent.clearItems();
            },
            markAllAsRead: function () {
                recursiveMarkAsRead(this);
                return $http.put(this.apiurl, {read: true});
                function recursiveMarkAsRead (node) {
                    if (node.branches.length) {
                        node.branches.forEach(recursiveMarkAsRead);
                    } else {
                        node.update({unread: 0});
                    }
                    node.items().forEach(function (item) {
                        item.read = true;
                    });
                }
            },
            unread: function () {
                if (this.folder) {
                    return this.branches.reduce(function (prev, cur) {
                        return prev + cur.unread();
                    }, 0);
                } else {
                    return unread;
                }
            },
            update: function (data) {
                this.title = data.title || this.title;
                this.userTitle = data.userTitle || this.userTitle;
                unread = (angular.isDefined(data.unread) ? data.unread : unread);
            },
            delete: function () {
                var self=this;
                if (this.branches.length > 0) {
                    throw(new Error('Not empty'));
                }
                foo_meta[this.apiurl] = undefined;
                this.parent.branches = this.parent.branches.filter(function (node) {
                    return node !== self;
                });
                var node = this.parent;
                while (node) {
                    node.clearItems();
                    node = node.parent;
                }
                return $http.delete(this.apiurl);
            }
        };
    }

    function Item (data) {
        this.update(data);
    }
    Item.prototype.update = function (data) {
      this.title = data.title;
      this.apiurl = data.apiurl;
      this.meta_apiurl = data.meta_apiurl;
      this.read = Boolean(data.read);
      this.pubdate = new Date(data.pubdate);
      this.content_apiurl = data.content_apiurl;
      this.link = data.link;
      this.starred = data.starred;
    };
    Item.prototype.getContent = getContent;
    Item.prototype.markAsRead = function (read) {
        read = Boolean(read);
        if (this.read !== read) {
            var unread = this.meta().unread();
            if (read) {
                unread--;
            } else  {
                unread++;
            }
            this.meta().update({unread: unread});
            this.read = read;
        }
        $http.put(this.apiurl, {read: read});
    };
    Item.prototype.meta = function () {
        return foo_meta[this.meta_apiurl];
    };
    Item.prototype.toggleStarred = function (starred) {
        this.starred = !this.starred;
        $http.put(this.apiurl, {starred: this.starred});
    };

    // Load some data initally
    $http.get(apiRoot, {params: {N: 0}}).then(function (res) {
        var meta_data = res.data.meta;
        last_modified = res.headers('last-modified');
        meta_data.forEach(function (feedData) {
            var parent;
            if (feedData.labels && feedData.labels[0]) {
                parent = folder(feedData.labels[0]);
            } else {
                parent = feedTree;
            }
            var newOb = treeNode(feedData, parent, false);
            parent.branches.push(newOb);
            foo_meta[feedData.apiurl] = newOb;
        });
    });

    feedTree.starred = treeNode({title: 'Starred', apiurl: apiRoot + '/posts?' + $httpParamSerializer({starred: true})},undefined, false);
    // Wrap the mark-as-read method to promt a refreah afterwrds..
    var innerMAAS = feedTree.starred.markAllAsRead.bind(feedTree.starred);
    feedTree.starred.markAllAsRead = function () {
        innerMAAS()
        .then(function () {
            refresh();
        });
    };

    // do a refresh ever 15 min
    $window.setTimeout(repeatRefresh, 900000);
    function repeatRefresh () {
        $window.setTimeout(repeatRefresh, 900000);
        refresh();
    }

    userService.onSignOut(function () {
        foo_meta = {};
        foo_items = {};
        feedTree = treeNode({apiurl: apiRoot, title: 'All'}, undefined, true);
        content = {};
    });

    return {
        addNew: function (url) {
            var newNode;
            return $http.post(apiRoot + '/feeds', {feedurl: url})
            .then(function (res) {
                newNode = treeNode({apiurl: res.headers('Location')}, feedTree, false);
                foo_meta[newNode.apiurl] = newNode;
                return newNode.getMore();
            })
            .then(function (data) {
                newNode.update(data.meta[0]);
                feedTree.branches.push(newNode);
                feedTree.clearItems();
                return newNode;
            });
        },
        refresh: refresh,
        feedTree: function () {
            return feedTree;
        }
    };

    function refresh () {
        return updateData()
        .then(function (res) {
            res.data.meta.forEach(function (meta) {
                if (foo_meta[meta.apiurl]) {
                    foo_meta[meta.apiurl].update(meta);
                } else {
                    foo_meta[meta.apiurl] = treeNode(meta, feedTree, false);
                    feedTree.branches.push(foo_meta[meta.apiurl]);
                    feedTree.clearItems();
                }
            });
            res.data.items.forEach(function (item) {
                var newItem;
                if (foo_items[item.apiurl]) {
                    foo_items[item.apiurl].update(item);
                    newItem = foo_items[item.apiurl];
                } else {
                    newItem = new Item(item);
                    foo_items[item.apiurl] = newItem;
                }
                var node = foo_meta[newItem.meta_apiurl];
                while (node) {
                    node.addItem(newItem);
                    node = node.parent;
                }
            });
        });
    }

    function getMore(node) {
        var config = {params: {N: getMoreNumber}};
        if (node.oldest) {
            var old = new Date();
            old.setTime(node.oldest);
            config.params.older_than = old;
        }
        return $http.get(node.apiurl, config);
    }

    function updateData () {
        var config;
        if (last_modified) {
            config = {params: {updated_since: last_modified}};
        }
        return $http.get(apiRoot, config)
        .then(function (res) {
            last_modified = res.headers('last-modified');
            return res;
        });
    }

    function getContent() {
        var self=this;

        if (!self.content_apiurl) {
            return $q(function (resolve, reject) {
                reject(new Error('No content'));
            });
        }

        if (content[self.content_apiurl]) {
            return $q(function (resolve) {
                resolve(content[self.content_apiurl]);
            });
        }

        return $http.get(self.content_apiurl)
        .then(function (res) {
            content[self.content_apiurl] = res.data;
            return content[self.content_apiurl];
        });
    }

    function min (arr) {
        return arr.reduce(function (prev, cur) {
            return (prev < cur ? prev : cur);
        });
    }

    function folder (folderName) {
        var newFolder,
            apiurl = apiRoot + '?' + $httpParamSerializer({label: folderName});
        if (foo_meta[apiurl]) {
            return foo_meta[apiurl];
        } else {
            newFolder = treeNode({apiurl: apiurl, title: folderName}, feedTree, true);
            feedTree.branches.push(newFolder);
            foo_meta[apiurl] = newFolder;
            return newFolder;
        }
    }
}]);
