var app;

module.exports.startServer = function () {
    var express = require('express'),
        url = require('url'),
        fs = require('fs');
    
    app = express();
    
    app.get('/*', function (req, res) {
        var path = url.parse(req.url).pathname;
        var feed_stream, body;
        
        feed_stream = fs.createReadStream(__dirname + '/' + path);
        
        feed_stream.on('data', function (chunck) {
            body += chunck.toString();
        })
        .on('error', function () {
            //res.writeHead(404)
            res.end();
            console.log('404 GET: ', path);
        })
        .on('end', function () {
            res.writeHead(200, {'content-type': 'application/atom+xml'});
            res.end(body);
            //console.log('200 GET: ', path);
        });
    });
    
    app.listen(1337);
};
