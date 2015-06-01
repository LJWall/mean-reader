var express = require('express'),
    passport = require('passport'),
    GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
    router;

var GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
var GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
var GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;

module.exports  = function (xsrf_checker) {
    if (!router) {
        router = express.Router();
        // routines to serialize and deserialize from the the session..
        passport.serializeUser(function(user, done) {
            done(null, user);
        });
        passport.deserializeUser(function(obj, done) {
            done(null, obj);
        });

        passport.use(new GoogleStrategy({
                clientID: GOOGLE_CLIENT_ID,
                clientSecret: GOOGLE_CLIENT_SECRET,
                callbackURL: GOOGLE_CALLBACK_URL
            },
            function(accessToken, refreshToken, profile, done) {
                // get user obj fro DB based on profile and return
                return done(null, profile);
            }
        ));
        router.use(passport.initialize());
        router.use(passport.session());
        router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
        router.get('/auth/google/callback', 
            passport.authenticate('google', { failureRedirect: '/reader' }),
            function(req, res) {
                res.redirect('/reader');
            }
        );
        router.get('/auth/logout', function(req, res){
            req.logout();
            res.status(200).end();
        });
        router.get('/auth/me', xsrf_checker, function (req, res) {
            if (req.isAuthenticated()) {
                res.status(200).json(req.user._json);
            } else {
                res.status(401).end();
            }
        });

    }
    return router;
};

