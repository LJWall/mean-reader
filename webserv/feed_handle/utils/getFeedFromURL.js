var FeedParser = require('feedparser'),
    request = require('request'),
    Promise = require('bluebird'),
    sax = require('sax')
    findAlternates = require('./findAlternates.js');

module.exports.makeRequest = function (feed_url) {
    return request(feed_url, {timeout: 10000, pool: false, headers: {
        'user-agent': 'Node/' + process.versions.node,
        'accept': 'text/html,application/xhtml+xml'
    }});
};

module.exports.followAlternate = function (req) {
    var promise;

    promise = new Promise(function (resolve, reject) {
        req.on('response', function (res) {
            if (/text\/html/.test(res.headers['content-type'])) {
                findAlternates(req)
                .then(function (alternates) {
                    if (alternates['application/atom+xml']) {
                        resolve(exports.makeRequest(alternates['application/atom+xml']));
                    } else if (alternates['application/rss+xml']) {
                        resolve(exports.makeRequest(alternates['application/rss+xml']));
                    } else {
                        reject(new Error('No alternates');)
                    }
                })
                .catch(function (e) {
                    reject(e);
                })
                .done();
            } else {
                resolve(req);
            }
        });
    }
    return promise;
};

module.exports.parseFeed = function (req) {
    var feed_data = {meta: {}, items: []},
        req,
        fp = new FeedParser(),
        promise;

    fp.on('meta', function (meta) {
        feed_data.meta = {
            title: meta.title,
            description: meta.description,
            link: meta.link,
            feedurl: meta.xmlurl
        };
    });
    
    fp.on('data', function(post) {
        feed_data.items.push({
            title: post.title,
            link: post.link,
            pubdate: post.pubdate,
            guid: post.guid
        });
    });

    promise = new Promise(function (resolve, reject) {
        fp.on('error', function (err) {reject(err); });
        fp.on('end', function () {
            resolve(feed_data);
        });
        req.on('error', function (err) {reject(err); });
    });

    req.pipe(fp);
    return promise;
};


