(function () {

function min (arr) {
    return arr.reduce(function (prev, cur) {
        return (prev < cur ? prev : cur);
    });
}

angular.module('reader.feeds.service')
.factory('feedService', ['$http', '$q', 'currentUserService', 'apiRoot', 'getMoreNumber', function ($http, $q, userService, apiRoot, getMoreNumber) {
    var meta_data = [],
        items = [],
        last_modified,
        meta_data_map,
        item_map,
        feedOldestItem = {},
        feedIsMore = {},
        content = {},
        feedTree = treeNode({apiurl: apiRoot, title: 'All'});

    var foo_meta = {},
        foo_items = {};

    function treeNode (data, parent) {
        var unread = data.unread;
        return {
            title: data.title,
            apiurl: data.apiurl,
            branches: [],
            items: [],
            parent: parent,
            getMore: function () {
                var self = this;
                return getMore(this.apiurl)
                .then(function (res) {
                    res.data.items.forEach(function (item) {
                        var newItem;
                        if (foo_items[item.apiurl]) {
                            foo_items[item.apiurl].update(item);
                        } else {
                            newItem = new Item(item);
                            foo_items[item.apiurl] = newItem;
                            addToTree(newItem, foo_meta[item.meta_apiurl]);
                        }
                    });
                });
                function addToTree (item, node) {
                    node.items.push(item);
                    node.oldest = (node.oldest ? min([node.oldest, item.pubdate.getTime()]) : item.pubdate.getTime());
                    if (node !== self && node.parent) {
                        addToTree(item, node.parent);
                    }
                }
            },
            markAllAsRead: function () {
                $http.put(this.apiurl, {read: true});
                recursiveMarkAsRead(this);
                function recursiveMarkAsRead (node) {
                    if (node.branches.length) {
                        node.branches.forEach(recursiveMarkAsRead);
                    } else {
                        node.update({unread: 0});
                        node.items.forEach(function (item) {
                            item.read = true;
                        });
                    }
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
                unread = (angular.isDefined(data.unread) ? data.unread : unread);
            }
        }
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
    $http.get(apiRoot, {params: {N: getMoreNumber}}).then(function (res) {
        cleanReturnData(res.data);
        meta_data = res.data.meta;
        items = res.data.items.map(function (item) {
            return new Item(item);
        });
        meta_data_map = buildMap(meta_data);
        item_map = buildMap(items);
        last_modified = res.headers('last-modified');
        feedIsMore[apiRoot] = true;
        meta_data.forEach(function (feedData) {
            feedIsMore[feedData.apiurl] = true;
        });
        items.forEach(function (item, i) {
            item.meta = meta_data[meta_data_map[item.meta_apiurl]];
            if (!feedOldestItem[item.meta_apiurl] || feedOldestItem[item.meta_apiurl].getTime() > item.pubdate.getTime()) {
                feedOldestItem[item.meta_apiurl] = item.pubdate;
            }
            if (i) {
                feedOldestItem[apiRoot] = (item.pubdate.getTime() < feedOldestItem[apiRoot].getTime() ? item.pubdate : feedOldestItem[apiRoot]);
            } else {
                feedOldestItem[apiRoot] = item.pubdate;
            }
        });

        /********** NEW ************/
        meta_data.forEach(function (feedData) {
            var newOb = treeNode(feedData, feedTree, true);
            feedTree.branches.push(newOb);
            foo_meta[feedData.apiurl] = newOb;
        });
        items.forEach(function (item) {
            item = new Item(item);
            var itemPubTime = item.pubdate.getTime();
            feedTree.items.push(item);
            feedTree.oldest = (feedTree.oldest ? min([feedTree.oldest, itemPubTime]) : itemPubTime);
            foo_items[item.apiurl] = item;
            foo_meta[item.meta_apiurl].items.push(item);
            foo_meta[item.meta_apiurl].oldest = (foo_meta[item.meta_apiurl].oldest ? min([itemPubTime, foo_meta[item.meta_apiurl].oldest]) : itemPubTime);
        });
        /********** /NEW ************/
    });

    userService.onSignOut(function () {
        meta_data = [];
        items = [];
    });

    return {
        getFeedMetaList: function () {
            return meta_data;
        },
        getFeedItems: function () {
            return items;
        },
        addNew: function (url) {
            return $http.post('api/feeds', {feedurl: url})
            .then(function (res) {
                return $http.get(res.headers('Location'));
            })
            .then(function (res) {
                cleanReturnData(res.data);
                workInNewData(res.data);
                return res.data.meta[0];
            });
        },
        deleteFeed: function (feedData) {
            meta_data = meta_data.filter(function (feed) {
                return feed.apiurl !== feedData.apiurl;
            });
            items = items.filter(function (item) {
                return item.meta_apiurl !== feedData.apiurl;
            });
            meta_data_map = buildMap(meta_data);
            item_map = buildMap(items);
            return $http.delete(feedData.apiurl);
        },
        updateData: updateData,
        refresh: function () {
            return updateData()
            .then(function (res) {
                res.data.meta.forEach(function (meta) {
                    if (foo_meta[meta.apiurl]) {
                        foo_meta[meta.apiurl].update(meta);
                    } else {
                        foo_meta[meta.apiurl] = treeNode(meta);
                        feedTree.branches.push(foo_meta[meta.apiurl]);
                    }
                });
                res.data.items.forEach(function (item) {
                    if (foo_items[item.apiurl]) {
                        foo_items[item.apiurl].update(item);
                    } else {
                        var node = foo_meta[item.meta_apiurl],
                            newItem = new Item(item);
                        foo_items[item.apiurl] = newItem;
                        while (node) {
                            node.items.push(newItem);
                            node = node.parent;
                        }
                    }
                });
            });
        },
        isMore: function () {
            return feedIsMore;
        },
        oldestItem: function () {
            return feedOldestItem;
        },
        getMore: getMore,
        feedTree: function () {
            return feedTree;
        }
    };

    function getMore(apiurl) {
        var config = {params: {N: getMoreNumber}};
        if (feedOldestItem[apiurl]) {
            config.params.older_than = feedOldestItem[apiurl];
        }
        return $http.get(apiurl, config)
        .then(function (res) {
            cleanReturnData(res.data);
            workInNewData(res.data);
            if (res.data.items.length < getMoreNumber) {
                feedIsMore[apiurl]=false;
            }
            res.data.items.forEach(function (item) {
                if (!feedOldestItem[apiurl] || feedOldestItem[apiurl].getTime() > item.pubdate.getTime()) {
                    feedOldestItem[apiurl] = item.pubdate;
                }
            });
            if (apiurl === apiRoot) {
                res.data.items.forEach(function (item) {
                    if (!feedOldestItem[item.meta_apiurl] || feedOldestItem[item.meta_apiurl].getTime() > item.pubdate.getTime()) {
                        feedOldestItem[item.meta_apiurl] = item.pubdate;
                    }
                });
            }
            return res;
        });
    }

    function updateData () {
        var config;
        if (last_modified) {
            config = {params: {updated_since: last_modified}};
        }
        return $http.get(apiRoot, config)
        .then(function (res) {
            last_modified = res.headers('last-modified');
            cleanReturnData(res.data);
            workInNewData(res.data);
            return res;
        });
    }

    function workInNewData(data) {
        data.meta.forEach(function (metaObj) {
            if (angular.isDefined(meta_data_map[metaObj.apiurl])) {
                meta_data[meta_data_map[metaObj.apiurl]] = metaObj;
            } else {
                meta_data.push(metaObj);
                meta_data_map[metaObj.apiurl] = meta_data.length - 1;
            }
        });
        data.items.forEach(function (itemObj) {
            if (angular.isDefined(item_map[itemObj.apiurl])) {
                items[item_map[itemObj.apiurl]].update(itemObj);
            } else {
                itemObj = new Item(itemObj);
                itemObj.meta = meta_data[meta_data_map[itemObj.meta_apiurl]];
                items.push(itemObj);
                item_map[itemObj.apiurl] = items.length - 1;
            }
        });
    }

    function cleanReturnData (data) {
        data.items.forEach(function (item) {
            item.pubdate = new Date(item.pubdate);
        });
        data.meta.forEach(function (m) {
            if (!m.unread) m.unread = 0;
        });
    }

    function buildMap (list) {
        return list.reduce(function (prev, cur, i) {
            prev[cur.apiurl] = i;
            return prev;
        }, {});
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
}]);

})();
