var FeedParser = require('feedparser'),
    request = require('request'),
    Promise = require('bluebird');


function defer() {
    var resolve, reject;
    var promise = new Promise(function() {
        resolve = arguments[0];
        reject = arguments[1];
    });
    return {
        resolve: resolve,
        reject: reject,
        promise: promise
    };
}

module.exports.getFeedFromSource = function (feed_url) {
    var feed_data = {meta: [], items: []},
        req,
        fp = new FeedParser();
        def = defer();
        
    // Somewhat pinched from FeedParser examples...
    if (feed_url.slice(0, 5) === 'feed:') {
        feed_url = 'http:' + feed_url.slice(5);
    }
    req = request(feed_url, {timeout: 10000, pool: false});
    //req.setMaxListeners(50);
    //req.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36')
    req.setHeader('accept', 'text/html,application/xhtml+xml');
    
    req.on('error', function (err) {def.reject(err)});
    req.on('response', function (res) {
        res.pipe(fp);
    });
    
    fp.on('error', function (err) {def.reject(err)});
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
        def.resolve(feed_data);
    });
    return def.promise;
};    

module.exports.updateFeedData = function (feed_data, mongodb) {
    feed_data.meta.lastUpdate = new Date();
    return Promise.all([
        mongodb.collection('feeds').insertOneAsync(feed_data.meta),
        mongodb.collection('posts').insertManyAsync(feed_data.items)
    ]);
};

module.exports.getFeedData = function (feed_url, mongodb) {

    var meta_promise = mongodb.collection('feeds')
                                      .find({url: feed_url})
                                      .limit(1).toArrayAsync();
    
    return meta_promise.then(function (meta_data) {
        if (meta_data.length) {
            return mongodb.collection('posts').find({xmlurl: meta_data[0].xmlurl}).toArrayAsync()
                    .then(function (posts_array) {
                        return {meta: meta_data[0], items: posts_array};
                    });
        } else
            throw new Error('Feed not found in db');
    });
};
