var express = require('express'),
    router = express.Router(),
    Promise = require('bluebird'),
    getFeed = require("./feed_handle/getFeed.js");


router.get('/', function (req, res) {
    Promise.all([
        getFeed.get('https://rideapart.com/feeds/rss2'),
        getFeed.get('http://surfingnorthdevon.blogspot.com/feeds/posts/default'),
        getFeed.get('http://www.houseofbonzer.com/feeds/posts/default'),
        getFeed.get('http://empiresurfboards.co.uk/?feed=atom')
    ])
    .then(function (feed_data) {
        var return_data = {
            meta: [feed_data[0].meta, feed_data[1].meta, feed_data[2].meta, feed_data[3].meta],
            items: feed_data[0].items.concat(feed_data[1].items).concat(feed_data[2].items).concat(feed_data[3].items)
        };
        res.status(200).end(JSON.stringify(return_data));
    })
    .done();
    
});


module.exports = router; 
