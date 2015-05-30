var express = require('express'),
    api_routes = require('./api_routes'),
    morgan = require('morgan'),
    bodyParser = require('body-parser'),
    xsrf = require('./auth/xsrf/xsrf'),
    session = require('express-session');
    app = express();

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(session({secret: 'monkey business', resave: false, saveUninitialized: false}));
app.get('/reader/api/get_xsrf_token', xsrf.get_xsrf_token)
app.use('/reader/api', xsrf.check_xsrf_header);
app.use('/reader/api', api_routes('/reader/api'));
app.use('/reader', express.static('frontend_build'));


app.listen(5667);
console.log('Listening on port 5667');


