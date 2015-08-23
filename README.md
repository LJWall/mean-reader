# mean-reader
[![Build Status](https://travis-ci.org/ljwall/mean-reader.svg?branch=master)](https://travis-ci.org/ljwall/mean-reader)

A feed reader built with the MEAN stack. Deployed at http://ljwall.eu/reader.

In case you want to play around with this or run it locally:

### Environmental requirements

- Needs a mongodb instance to connect to.
- Grunt, NPM, bower.
- Google closure compiler, with environment variable `CLOSURE_PATH` pointing to directory containing `build/compiler.jar`.
- Environment variable `MEAN_ENV` should be set to one of 'test', 'development', or 'production'.  This is picked up in `webserv/config.js`, which sets db URI/name etc.

### Running

In project directory `npm i` and `bower i` to install dependencies. 

- `grunt test` runs jshint, front end tests with karma and back end tests with jasmine-npm.  
- `grunt build` does a one-off build - i.e. compiles less to css and front-end js with closure compiler.
- `grunt run` builds and runs the node/express back end.  Also watches, re-builds and re-starts on file change.

### Code entry points

- `webserv/main.js` is the entry point for the backend API. (And also serves static files when testing/dev.)
- `webserv/updateFeeds.js` is a service to poll subscribed feeds and update db with anything new.

### Sign in with Google

To use this, you need Google OAuth 2.0 client credentials.  Go to https://console.developers.google.com, and the Auth/credentials section, to get these.  You need get a client ID and Secret.  The js origin should be http://localhost:5667, and redirect url should be http://localhost:5667/reader/auth/google/callback. The ID and secret can be set as environment variables, or set in `webserv/config.js`.  
