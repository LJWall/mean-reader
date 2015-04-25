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
    req.setHeader('user-agent', 'Node/' + process.versions.node);
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
                            feedurl: feed_url};
    });
    
    fp.on('data', function(post) {
        feed_data.items.push({title: post.title,
                              link: post.link,
                              pubdate: post.pubdate,
                              guid: post.guid,
                              feedurl: feed_url});
    });
    fp.on('end', function () {
        def.resolve(feed_data);
    });
    return def.promise;
};    

module.exports.updateFeedData = function (feed_data, mongodb) {
    var ret = [];
    ret.push(mongodb.collection('feeds').updateOneAsync({feedurl: feed_data.meta.feedurl}, {$set: feed_data.meta}, {upsert: true}));
    feed_data.items.forEach(function (post) {
        ret.push(mongodb.collection('posts').updateOneAsync({feedurl: post.feedurl, guid: post.guid}, {$set: post}, {upsert: true}));
    });
    return Promise.all(ret);
};

module.exports.getFeedData = function (feed_url, mongodb) {

    var meta_promise = mongodb.collection('feeds')
                                      .find({feedurl: feed_url})
                                      .limit(1).toArrayAsync();
    
    return meta_promise.then(function (meta_data) {
        if (meta_data.length) {
            return mongodb.collection('posts').find({feedurl: meta_data[0].feedurl}).toArrayAsync()
                    .then(function (posts_array) {
                        return {meta: meta_data[0], items: posts_array};
                    });
        } else
            throw new Error('Feed not found in db');
    });
};
