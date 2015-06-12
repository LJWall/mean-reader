var FeedParser = require('feedparser'),
    request = require('request'),
    Promise = require('bluebird'),
    sax = require('sax'),
    findAlternates = require('./findAlternates.js'),
    makeRequest,
    parseFeed,
    get, first;

require('array.prototype.find');


module.exports = get = function (feedurl, followAlternates, followNext) {
    var req, promise,
        pf = parseFeed(), fa = findAlternates();

    try { req = makeRequest(feedurl); }
    catch (e) { return Promise.reject(e); }

    req.on('response', function() {
        req.pipe(pf.stream);
        req.pipe(fa.stream);
    });

    promise = Promise.settle([pf.result, fa.result])
    .then(function (results) {
        if (results[0].isFulfilled()) {
            return results[0].value();
        } else if (results[1].isFulfilled() && followAlternates && results[1].value().length>0) {
            return first(results[1].value(), get);
        } else {
            throw results[0].reason();
        }
    })
    .then(function (feedData) {
        if (followNext && feedData.fullMeta['atom:link'] && feedData.fullMeta['atom:link'].length) {
            var next = feedData.fullMeta['atom:link'].find(function (ele) {
                return (ele['@'] && ele['@'].rel === 'next');       
            });
            if (next) {
                return get(next['@'].href, followAlternates, true)
                .then(function (nextData) {
                    feedData.items = feedData.items.concat(nextData.items);
                    return feedData;
                })
                .catch(function (e) {
                    return feedData;
                });
            }
        }
        return feedData;
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
    return request(feed_url, {
        timeout: 10000,
        followRedirect: true,
        pool: false,
        headers: {
            'user-agent': 'Node/' + process.versions.node,
        }
    });
};

parseFeed = function () {
    var fp, promise;

    promise = new Promise(function (resolve, reject) {
        var feed_data = {meta: {}, items: []};
        fp = new FeedParser();

        fp.on('meta', function (meta) {
            feed_data.meta = {
                title: meta.title,
                description: meta.description,
                link: meta.link,
                feedurl: meta.xmlurl || req.uri.href
            };
            feed_data.fullMeta = meta;
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
    });

    return {stream: fp, result: promise};
};


