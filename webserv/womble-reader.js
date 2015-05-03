var express = require('express'),
    router = express.Router(),
    Promise = require('bluebird'),
    //getFeed = require("./feed_handle/getFeed.js");
    mongoFeedStore = require('./feed_handle/utils/mongoFeedStore.js');


// Get everything
router.get('/', function (req, res) {
    mongoFeedStore.getMongoFeedData()
    .then(function (feed_data) {
        res.status(200).end(JSON.stringify(feed_data));
    })
    .done();
    
});

// get array of meta items
router.get('/meta', function (req, res) {
    mongoFeedStore.getMongoFeedMeta()
    .then(function (feed_data) {
        res.status(200).end(JSON.stringify(feed_data));
    })
    .done();
});

//get all the items
router.get('/items', function (req, res) {
    mongoFeedStore.getMongoFeedItems()
    .then(function (feed_data) {
        res.status(200).end(JSON.stringify(feed_data));
    })
    .done();
});


// get items by meta_id
router.get('/items/:meta_id', function (req, res) {
    mongoFeedStore.getMongoFeedItemsByID(req.params.meta_id)
    .then(function (feed_data) {
        res.status(200).end(JSON.stringify(feed_data));
    })
    .done();
});


module.exports = router; 
