var express = require('express'),
    router = express.Router(),
    Promise = require('bluebird'),
    getFeed = require("./feed_handle/getFeed.js");
    //mongoFeedStore = require('./feed_handle/utils/mongoFeedStore.js');


// Get everything
router.get('/', function (req, res) {
    getFeed.get()
    .then(function (feed_data) {
        res.status(200).end(JSON.stringify(feed_data));
    })
    .done();
    
});

// get array of meta items
router.get('/meta', function (req, res) {
    getFeed.getMeta()
    .then(function (feed_data) {
        res.status(200).end(JSON.stringify(feed_data));
    })
    .done();
});

//get all the items
router.get('/items', function (req, res) {
    getFeed.getItems()
    .then(function (feed_data) {
        res.status(200).end(JSON.stringify(feed_data));
    })
    .done();
});


// get items by meta_id
router.get('/items/:meta_id', function (req, res) {
    getFeed.getItemsByID(req.params.meta_id)
    .then(function (feed_data) {
        res.status(200).end(JSON.stringify(feed_data));
    })
    .done();
});

// add a new feed to look at...
router.post('/add', function (req, res) {
    var newFeedURL = req.body.url;
    if (!newFeedURL) {
        res.status(400).end(JSON.stringify({msg: 'Feed url required'}));
        return;
    }
    getFeed.add(newFeedURL)
    .then(function (feed_data) {
        res.status(200).end(JSON.stringify(feed_data));
    })
    .done();
});


module.exports = router; 
