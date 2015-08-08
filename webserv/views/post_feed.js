var addFeed = require('../feed_handle/getFeed.js'),
    url_for = require('../url_for');

module.exports = function (req, res) {
    if (req.body.feedurl) {
        var feed_url = req.body.feedurl;
        if (feed_url.slice(0, 5) === 'feed:') {
            feed_url = 'http:' + feed_url.slice(5);
        }
        addFeed(feed_url, req.user._id)
        .then(function (meta) {
            res.status(201).set('Location', url_for.feed(meta._id.toString())).end();
        })
        .catch(function (err) {
            res.status(500).end();
        })
        .done();
    } else {
        res.status(400).json({error: 'No feed URL in request body'});
    }
};
