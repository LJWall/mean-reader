var FeedParser = require('feedparser'),
    request = require('request'),
    q = require('q');

var getFeedFromSource = function (feed_url) {
    var feed_data = {meta: [], items: []};
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
        res.pipe(fp);
    });
    
    fp.on('error', function (err) {defer.reject(err)});
    fp.on('meta', function (meta) {
        feed_data.meta = {title: meta.title,
                            description: meta.description,
                            link: meta.link,
                            xmlurl: meta.xmlurl,
                            url: feed_url};
    });
    
    fp.on('data', function(post) {
        feed_data.items.push({title: post.title,
                              link: post.link,
                              pubdate: post.pubdate,
                              guid: post.guid,
                              xmlurl: post.meta.xmlurl});
    });
    fp.on('end', function () {
        defer.resolve(feed_data);
    });
    return defer.promise;
};    


module.exports.getFeedData = function (feed_url, mongodb) {

    var meta_promise = q.npost(mongodb.collection('feeds')
                                      .find({url: feed_url})
                                      .limit(1), 'toArray');
    
    return meta_promise.then(function (meta_data) {
        if (meta_data.length) {
            // it's already in the db
            if (Date.now() - meta_data[0].lastUpdate.getTime() < 3600000) {
                // been updated withing the hour, just use the mongo data
                return q.npost(mongodb.collection('posts').find({xmlurl: meta_data[0].xmlurl}), 'toArray')
                        .then(function (posts_array) {
                            return {meta: meta_data[0], items: posts_array};
                        });
            }
            else {
                // last updated over an hour ago.
                throw 'Not implemented';
            }
        }
        else {
            // resolve by getting from source...
            return getFeedFromSource(feed_url).then(function (feed_data) {
                feed_data.meta.lastUpdate = new Date();
                mongodb.collection('feeds').insertOne(feed_data.meta, function () {});
                mongodb.collection('posts').insertMany(feed_data.items, function () {});
                return feed_data;
            });
        }
    });
    
};
