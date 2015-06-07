var sax = require('sax'),
    request = require('request'),
    req, saxParser;

saxParser = sax.createStream(false, {lowercase: true});

saxParser.on('error', function (e) {
  console.log('Darn it.', e);
});

saxParser.on('opentag', function (node) {
  if (node.name==='link' && node.attributes.rel==='alternate') {
    console.log(node);
  }
});

saxParser.on('end', function () {
  console.log('done diddly..');
});

req = request('http://magicseaweed.com', {timeout: 10000, pool: false});
req.pipe(saxParser);
