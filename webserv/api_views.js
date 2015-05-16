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


/*
// Get everything
router.get('/', function (req, res) {
    getFeed.get()
    .then(function (feed_data) {
        res.status(200).json(feed_data);
    })
    .done();
});

// add a new feed
router.post('/feeds', function (req, res) {
    var newFeedURL = req.body.feedurl;
    if (!newFeedURL) {
        res.status(400).json({error: 'feedurl parameter required', msg: 'Something went wrong'});
        return;
    }
    getFeed.add(newFeedURL)
    .then(function (feed_data) {
        res.status(200).json(feed_data);
    })
    .done();

});
 */