var sax = require('sax'),
    request = require('request'),
    Promise = require('bluebird');

module.exports = function (req) {
    promise = new Promise(function (resolve, reject) {
        var alternates=[],
            promise,
            saxParser = sax.createStream(false, {lowercase: true});

        saxParser.on('opentag', function (node) {
            if (node.name==='link' && node.attributes.rel==='alternate' &&
                    /(atom|rss|xml)/i.test(node.attributes.type)) {
                alternates.push(node.attributes.href);
            }
        });

        saxParser.on('error', function (e) {
            reject(e);
        });
        saxParser.on('end', function () {
            resolve(alternates);
        });
        req.pipe(saxParser);
    });

    return promise;
};
