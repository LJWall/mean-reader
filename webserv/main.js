var express = require('express'),
    api_routes = require('./api_routes'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    app = express();

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use('/reader', api_routes('/reader'));
app.use(express.static('frontend_build'));


app.listen(5667);
console.log('Listening on port 5667');


