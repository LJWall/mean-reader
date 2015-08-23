var express = require('express'),
    url_for = require('./url_for'),
    ObjectID = require('mongodb').ObjectID,
    app = express();

app.param('ObjectID', function processObjectID (req, res, next, id) {
    try {
        req.params.ObjectID = ObjectID.createFromHexString(id);
    }
    catch (e) {
        return res.end(400);
    }
    next();
});

app.use(require('./request_prep'));

app.get(url_for.apiroot(),            require('./views/get_all'));
app.put(url_for.apiroot(),            require('./views/put_all'));
app.post(url_for.feed(),              require('./views/post_feed'));
app.get(url_for.feed(':ObjectID'),    require('./views/get_feed'));
app.put(url_for.feed(':ObjectID'),    require('./views/put_feed'));
app.delete(url_for.feed(':ObjectID'), require('./views/delete_feed'));
app.put(url_for.item(':ObjectID'),    require('./views/put_item'));
app.get(url_for.item(),               require('./views/get_items'));
app.put(url_for.item(),               require('./views/put_all'));
app.get(url_for.content(':ObjectID'), require('./views/get_content'));

module.exports = app;
