angular.module('reader.feeds.service')
.factory('feedService', ['$http', '$q', 'currentUserService', 'apiRoot', 'getMoreNumber', function ($http, $q, userService, apiRoot, getMoreNumber) {
    var last_modified,
        content = {},
        feedTree = treeNode({apiurl: apiRoot, title: 'All'}),
        foo_meta = {},
        foo_items = {};

    function treeNode (data, parent) {
        var unread = data.unread || 0,
            isMore = true,
            items = [],
            node_item_map = {};

        return {
            title: data.title,
            userTitle: data.userTitle,
            apiurl: data.apiurl,
            branches: [],
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
                this.userTitle = userTitle;
                $http.put(this.apiurl, {userTitle: userTitle});
            },
            markAllAsRead: function () {
                $http.put(this.apiurl, {read: true});
                recursiveMarkAsRead(this);
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
                if (this.branches.length) {
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

    // Load some data initally
    $http.get(apiRoot, {params: {N: 0}}).then(function (res) {
        var meta_data = res.data.meta,
            items = res.data.items.map(function (item) {
                return new Item(item);
            });
        last_modified = res.headers('last-modified');
        meta_data.forEach(function (feedData) {
            var newOb = treeNode(feedData, feedTree);
            feedTree.branches.push(newOb);
            foo_meta[feedData.apiurl] = newOb;
        });
    });

    userService.onSignOut(function () {
        foo_meta = {};
        foo_items = {};
        feedTree = treeNode({apiurl: apiRoot, title: 'All'});
        content = {};
    });

    return {
        addNew: function (url) {
            var newNode;
            return $http.post(apiRoot + '/feeds', {feedurl: url})
            .then(function (res) {
                newNode = treeNode({apiurl: res.headers('Location')}, feedTree);
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
        refresh: function () {
            return updateData()
            .then(function (res) {
                res.data.meta.forEach(function (meta) {
                    if (foo_meta[meta.apiurl]) {
                        foo_meta[meta.apiurl].update(meta);
                    } else {
                        foo_meta[meta.apiurl] = treeNode(meta, feedTree);
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
        },
        feedTree: function () {
            return feedTree;
        }
    };

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

}]);
