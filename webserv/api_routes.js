var express = require('express'),
    app,
    mod_views = require("./api_views"),
    views,
    path,
    url_for;
    
module.exports = function (mount_path) {
    path = mount_path
    views = views || mod_views(url_for);
    app = app || setupRoutes();
    return app; 
}


url_for = {
    feed: function (id) {
        return path + '/feeds/' + id.toString();
    },
    item: function (id) {
        return path + '/posts/' + id.toString();
    }
};

function setupRoutes() {
    var newApp = express();
    newApp.get('/', views.getAll);
    newApp.post('/feeds', views.postAdd);
    newApp.put('/posts/:item_id', views.putPost);
    newApp.use(views['404']);
    return newApp;
};    
