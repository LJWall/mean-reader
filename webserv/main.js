var express = require('express');
var womble = require('./womble-reader');
var morgan = require('morgan');
var bodyParser = require('body-parser');

app = express();
app.use(bodyParser.json());
app.use('/reader', womble);
app.use(morgan('dev'));
app.use(express.static('frontend_build'));
app.listen(5667);
console.log('Listening on port 5667');

