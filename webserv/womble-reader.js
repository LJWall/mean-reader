var express = require('express'),
    feed_data = {meta: [], items: []},
    router = express.Router(),
    Promise = require('bluebird'),
    mongodb = require("mongodb"),
    MongoClient = Promise.promisifyAll(mongodb.MongoClient);

Promise.promisifyAll(mongodb.Collection.prototype);
Promise.promisifyAll(mongodb.Cursor.prototype);


router.get('/', function (req, res) {
    res.status(200).end(JSON.stringify(feed_data));
});


module.exports = router; 
