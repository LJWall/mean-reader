var feedModelMaker = require("./feed_handle/getFeed.js"),
    Promise = require('bluebird');


module.exports = function (url_for) {
    var feedModel = feedModelMaker();
    return {
        getAll: function (req, res) {
            Promise.props({
                meta: feedModel.feeds.findMany({}).map(cleanMeta),
                items: feedModel.posts.findMany({}).map(cleanItem),
            })
            .then(function (data) {
                res.status(200).json(data);
            })
            .done();
        },
        postAdd: function (req, res) {
            if (req.body.feedurl) {
                feedModel.add(req.body.feedurl)
                .then(function (meta) {
                    return Promise.props({
                        meta: [cleanMeta(meta)],
                        items: feedModel.posts.findMany({_id: meta._id}).map(cleanItem)
                    });
                })
                .then(function (data) {
                    res.status(201).json(data);
                })
                .catch(function (err) {
                    res.status(500).json({error: err});
                })
                .done();
            } else {
                res.status(400).json({error: 'No feed URL in request body'});
            }
        }
    };
    
    
    function cleanItem (item_data) {
        var obj = {};
        obj.apiurl = url_for.item(item_data._id.toString());
        obj.meta_apiurl =  url_for.feed(item_data.meta_id.toString());
        obj.link =  item_data.link;
        obj.title = item_data.title;
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

