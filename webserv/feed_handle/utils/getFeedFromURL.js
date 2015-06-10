var FeedParser = require('feedparser'),
    request = require('request'),
    Promise = require('bluebird'),
    sax = require('sax'),
    findAlternates = require('./findAlternates.js'),
    makeRequest,
    parseFeed,
    get, first;



module.exports = get = function (feedurl, followAlternates) {
    var req, promise;

    try { req = makeRequest(feedurl); }
    catch (e) { return Promise.reject(e); }

    promise = Promise.settle([parseFeed(req), findAlternates(req)])
    .then(function (results) {
        if (results[0].isFulfilled()) {
            return results[0].value();
        } else if (results[1].isFulfilled() && followAlternates && results[1].value().length>0) {
            return first(results[1].value(), get);
        } else {
            throw results[0].reason();
        }
    });

    return promise;
};

first = function (arr, promise_maker) {
    var errs = [];
    return Promise.reduce(
        arr,
        function (total, item, index) {
            if (total) { return total; }
            else {
                return promise_maker(item)
                .catch( function (e) {
                    errs.push(e);
                    if (index == arr.length-1) { throw errs; }
                    return null;
                });
            }
        },
        null
    );
};

makeRequest = function (feed_url) {
    return request(feed_url, {timeout: 10000, pool: false, headers: {
        'user-agent': 'Node/' + process.versions.node,
        'accept': 'text/html,application/xhtml+xml'
    }});
};

parseFeed = function (req) {
    var promise = new Promise(function (resolve, reject) {
        var feed_data = {meta: {}, items: []},
            fp = new FeedParser();

        fp.on('meta', function (meta) {
            feed_data.meta = {
                title: meta.title,
                description: meta.description,
                link: meta.link,
                feedurl: meta.xmlurl || req.uri.href
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

        fp.on('error', function (err) {reject(err); });
        fp.on('end', function () {
            resolve(feed_data);
        });
        req.on('error', function (err) {reject(err); });
        req.pipe(fp);
    });

    return promise;
};


