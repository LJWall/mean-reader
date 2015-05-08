var express = require('express');
var reader = require('./mean-reader');
var morgan = require('morgan');
var bodyParser = require('body-parser');

app = express();

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use('/reader', reader);
app.use(express.static('frontend_build'));

app.listen(5667);
console.log('Listening on port 5667');

