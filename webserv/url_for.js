var config = require('./config');

module.exports = {
    feed: function (id) {
        return config.appMountPath + '/feeds' + (id ? '/' + id.toString() : '');
    },
    item: function (id) {
        return config.appMountPath + '/posts' + (id ? '/' + id.toString() : '');
    },
    content: function (id) {
        return config.appMountPath + '/content' + (id ? '/' + id.toString() : '');
    },
    apiroot: function () {
        return config.appMountPath;
    }
};
