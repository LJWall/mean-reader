var express = require('express'),
    FeedParser = require('feedparser'),
    request = require('request'),
    q = require('q'),
    feed_data = {meta: {}, items: []},
    router = express.Router();


router.get('/', function (req, res) {
        res.status(200).end(JSON.stringify(feed_data));
});

//router.post('/', function (req, res) {
//    var feed_url = req.body.feed_url;
//    if (!feed_url) {
//        res.status(400).end();
//        return;
//    }
//    getFeedData(feed_url)
//        .then(function () {res.status(200).end(JSON.stringify(feed_data));})
//        .then(null, function (err) {res.status(500).end({err: err});});
//    
//    
//});

var getFeedData = function (feed_url) {
    // Somewhat pinched from FeedParser examples...
    if (feed_url.slice(0, 5) === 'feed:') {
        feed_url = 'http:' + feed_url.slice(5);
    }
    var req = request(feed_url, {timeout: 10000, pool: false});
    //req.setMaxListeners(50);
    //req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36')
    req.setHeader('accept', 'text/html,application/xhtml+xml');
    var fp = new FeedParser(),
        defer = q.defer();
    req.on('error', function (err) {defer.reject(err)});
    req.on('response', function (res) {
        //console.log('Resonse from feed...');
        res.pipe(fp);
    });
    
    fp.on('error', function (err) {defer.reject(err)});
    fp.on('meta', function (meta) {
        feed_data.meta[meta.xmlurl] = {title: meta.title,
                                       description: meta.description,
                                       link: meta.link};
    });
    fp.on('data', function(post) {
        feed_data.items.push({title: post.title,
                              link: post.link,
                              pubdate: post.pubdate,
                              guid: post.guid,
                              xmlurl: post.meta.xmlurl,
                              read: false});
    });
    fp.on('end', function () {
        defer.resolve('Success')
    });
    return defer.promise;
    
};

getFeedData('http://127.0.0.1:1337/surf.atom');
getFeedData('https://rideapart.com/articles.rss');

module.exports = router; 
