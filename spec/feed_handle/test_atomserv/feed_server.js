var app, server,
    express = require('express');

app = express();
app.use(express.static(__dirname));

module.exports.startServer = function () {
    server = app.listen(1337);
};

module.exports.stopServer = function () {
    server.close();
};
