var feedModelMaker = require("./feed_handle/getFeed.js"),
    Promise = require('bluebird'),
    ObjectID = require('mongodb').ObjectID;


module.exports = function (url_for) {
    var feedModel = feedModelMaker();
    return {
        getAll: function (req, res) {
            var last_update = {dt: new Date('2000-01-01')},
                query = {user_id: req.user._id};
            if (req.query.updated_since) {
                try {
                    var dt = new Date(req.query.updated_since);
                    query.last_update = {$gt: dt};
                }
                catch (e) {
                    res.status(500).end();
                }
            }
            Promise.props({
                meta: feedModel.feeds.findMany(query).reduce(reducer.bind(last_update, cleanMeta), []),
                items: feedModel.posts.findMany(query).reduce(reducer.bind(last_update, cleanItem), [])
            })
            .then(function (data) {
                res.status(200)
                .set('last-modified', last_update.dt)
                .set('cache-control', 'private, max-age=0, no-cache')
                .json(data);
            })
            .done();
        },
        postAdd: function (req, res) {
            if (req.body.feedurl) {
                var feed_url = req.body.feedurl;
                if (feed_url.slice(0, 5) === 'feed:') {
                    feed_url = 'http:' + feed_url.slice(5);
                }
                feedModel.add(feed_url, req.user._id)
                .then(function (meta) {
                    return Promise.props({
                        meta: [cleanMeta(meta)],
                        items: feedModel.posts.findMany({meta_id: meta._id, user_id: req.user._id}).reduce(reducer.bind(null, cleanItem), [])
                    });
                })
                .then(function (data) {
                    res.status(201).json(data);
                })
                .catch(function (err) {
                    res.status(500).end();
                })
                .done();
            } else {
                res.status(400).json({error: 'No feed URL in request body'});
            }
        },
        '404': function (req, res) {
            res.status(404).end();
        },
        putPost: function (req, res) {
            var obj_id;
            if (typeof req.params.item_id !== 'string') {
                res.status(500).end();
                return;
            }
            try {
                obj_id = ObjectID(req.params.item_id);
            } catch(e) {
                res.status(404).end();
                return;
            }
            feedModel.posts.findOne({_id: ObjectID(req.params.item_id), user_id: req.user._id})
            .then(function (item) {
                if (!item) {
                    res.status(404).end();
                    return;
                }
                if (typeof req.body.read === 'boolean') item.read = req.body.read;
                res.status(200).json(cleanItem(item));
                return item.save();
            })
            .done();
        }
    };
    
    function reducer(cleaner, total, item) {
        try {
            total.push(cleaner(item));
            if (item.last_update && item.last_update.getTime() > this.dt.getTime()) {
                this.dt = item.last_update;
            }
        }
        catch (e) {
            // loggging?
        }
        return total;
    }
    
    function cleanItem (item_data) {
        var obj = {};
        obj.apiurl = url_for.item(item_data._id.toString());
        obj.meta_apiurl =  url_for.feed(item_data.meta_id.toString());
        obj.link =  item_data.link;
        obj.title = item_data.title;
        obj.pubdate = item_data.pubdate;
        obj.read = item_data.read || false;
        return obj;
    }
    
    function cleanMeta (meta) {
        var obj = {};
        obj.apiurl = url_for.feed(meta._id.toString());
        obj.feedurl =  meta.feedurl;
        if (meta.link) obj.link =  meta.link;
        obj.title = meta.title;
        if (meta.description) { obj.description = meta.description; }
        return obj;
    }
}; 

