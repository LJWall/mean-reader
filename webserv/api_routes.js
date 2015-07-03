var express = require('express'),
    app,
    mod_views = require("./api_views"),
    views,
    path,
    url_for,
    ObjectID = require('mongodb').ObjectID;
    
module.exports = function (mount_path) {
    path = mount_path;
    views = views || mod_views(url_for);
    app = app || setupRoutes();
    return app;
};


url_for = {
    feed: function (id) {
        return path + '/feeds/' + id.toString();
    },
    item: function (id) {
        return path + '/posts/' + id.toString();
    },
    apiroot: function () {
        return path;
    }
};

var processObjectID = function processObjectID (req, res, next, id) {
    try {
        req.params.ObjectID = ObjectID.createFromHexString(id);
    }
    catch (e) {
        return res.end(400);
    }
    next();
};

function setupRoutes() {
    var newApp = express();
    newApp.param('ObjectID', processObjectID);
    newApp.get('/', views.getAll);
    newApp.put('/', views.putAll);
    newApp.post('/feeds', views.postAdd);
    newApp.get('/feeds/:ObjectID', views.getFeed);
    newApp.put('/feeds/:ObjectID', views.putFeed);
    newApp.put('/posts/:ObjectID', views.putPost);
    newApp.use(views['404']);
    return newApp;
}
    
