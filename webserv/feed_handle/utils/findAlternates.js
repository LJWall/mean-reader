var sax = require('sax'),
    request = require('request'),
    Promise = require('bluebird');

module.exports = function (req) {
    promise = new Promise(function (resolve, reject) {
        var alternates={atom: [], rss: [], xml: []},
            promise,
            saxParser = sax.createStream(false, {lowercase: true});

        saxParser.on('opentag', function (node) {
            if (node.name==='link' && node.attributes.rel==='alternate') {
                if (/atom/i.test(node.attributes.type)) {
                    alternates.atom.push(node.attributes.href);
                } else if (/rss/i.test(node.attributes.type)) {
                    alternates.rss.push(node.attributes.href);
                } else if (/xml/i.test(node.attributes.type)) {
                    alternates.xml.push(node.attributes.href);
                }
            }
        });

        saxParser.on('error', function (e) {
            reject(e);
        });
        saxParser.on('end', function () {
            resolve(alternates.atom.concat(alternates.rss).concat(alternates.xml));
        });
        req.pipe(saxParser);
    });

    return promise;
};
