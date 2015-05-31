var express = require('express'),
    api_routes = require('./api_routes'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    xsrf = require('./auth/xsrf/xsrf.js'),
    user = require('./auth/user/user.js'),
    session = require('express-session');
    app = express();

app.use(morgan('dev'));
app.use(bodyParser.json());

app.use(session({secret: 'monkey business', resave: false, saveUninitialized: false}));

app.use('/reader', express.static('frontend_build'));


app.get('/reader/xsrf/get_token', xsrf.get_xsrf_token);
app.use('/reader', user(xsrf.check_xsrf_header));

app.use('/reader/api', xsrf.check_xsrf_header, api_routes('/reader/api'));


app.listen(5667);
console.log('Listening on port 5667');


