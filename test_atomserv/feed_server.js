var express = require('express'),
    url = require('url'),
    fs = require('fs'),
    app = express();

app.get('/*', function (req, res) {
    var path = url.parse(req.url).pathname;
    var feed_stream, body;
    
    feed_stream = fs.createReadStream('test_atomserv' + path);
    
    feed_stream.on('data', function (chunck) {
        body += chunck.toString();
    })
    .on('error', function () {
        res.writeHead(404)
        res.end();
        console.log('404 GET: ', path);
    })
    .on('end', function () {
        res.writeHead(200, {'content-type': 'application/atom+xml'});
        res.end(body);
        console.log('200 GET: ', path);
    });
})

server = app.listen(1337);

console.log('Server running at http://127.0.0.1:' + server.address().port);