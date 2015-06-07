var sax = require('sax'),
    request = require('request'),
    Promise = require('bluebird');

module.exports = function (req) {
    var feeds={},
        promise,
        saxParser = sax.createStream(false, {lowercase: true});

    saxParser.on('opentag', function (node) {
        if (node.name==='link' && node.attributes.rel==='alternate') {
            if (node.attributes.type === 'application/rss+xml' || node.attributes.type === 'application/atom+xml') {
                feeds[node.attributes.type] = node.attributes.href;
            }
        }
    });

    promise = new Promise(function (resolve, reject) {
        saxParser.on('error', function (e) {
            reject(e);
        });
        saxParser.on('end', function () {
            resolve(feeds);
        });
    });

    req.pipe(saxParser);
    return promise;
};
