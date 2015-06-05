var express = require('express'),
    passport = require('passport'),
    GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
    mongoConnect = require('../../mongoConnect.js'),
    ObjectID = require('mongodb').ObjectID,
    router;

var GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
var GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
var GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;

module.exports = function (xsrf_checker) {
    if (!router) {
        router = express.Router();
        // routines to serialize and deserialize from the the session..
        passport.serializeUser(function(user, done) {
            done(null, user);
        });
        passport.deserializeUser(function(obj, done) {
            if (typeof obj._id === 'string') {
                obj._id = ObjectID(obj._id);
            }
            done(null, obj);
        });

        passport.use(new GoogleStrategy({
                clientID: GOOGLE_CLIENT_ID,
                clientSecret: GOOGLE_CLIENT_SECRET,
                callbackURL: GOOGLE_CALLBACK_URL
            },
            function(accessToken, refreshToken, profile, done) {
                // get user obj fro DB based (or create new one).
                getUserFromDb({provider: profile.provider, provider_id: profile.id})
                .then(function (user) {
                    if (user) {
                        user.displayName = profile.displayName;
                        done(null, user);
                    } else {
                        createUser(profile)
                        .then(function (user) {
                            user.displayName = profile.displayName;
                            done(null, user);
                        });
                    }
                });
            }
        ));
        router.use(passport.initialize());
        router.use(passport.session());
        router.get('/auth/google',
            passport.authenticate('google', { scope: ['profile'] }));
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
                res.status(200).json({
                    provider: req.user.provider,
                    displayName: req.user.displayName
                });
            } else {
                res.status(401).end();
            }
        });

    }
    return router;
};

module.exports.check_authenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.status(401).end();
    }
};

function getUserFromDb (query) {
    return mongoConnect.connection()
    .call('collection', 'users')
    .call('findOneAsync', query);
}

function createUser (profile) {
    return mongoConnect.connection()
    .call('collection', 'users')
    .call('insertOneAsync', {
        //  Only store the provider and the provider ID.
        // (for any other user data, read it afreash each time.)
        provider: profile.provider,
        provider_id: profile.id,
    })
    .then(function (result) {
        return result.ops[0];
    });
    
}
