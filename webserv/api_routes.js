var express = require('express'),
    router = express.Router(),
    Promise = require('bluebird'),
    getFeed = require("./feed_handle/getFeed.js");

    
module.exports = router; 

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

router.use(function(err, req, res, next) {
    res.status(500).json({error: 'Unknown server error'});
});


router.use(function (req, res) {
    res.status(404).json({error: 'Not found'});
})

/* 
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

*/

