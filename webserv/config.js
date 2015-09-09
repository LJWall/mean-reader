
if (process.env.MEAN_ENV === 'test') {
    exports.mongo_uri = 'mongodb://127.0.0.1:27017/testwomble';
} else if (process.env.MEAN_ENV === 'development') {
    exports.mongo_uri = 'mongodb://127.0.0.1:27017/meanfeed';
} else if (process.env.MEAN_ENV === 'production') {
    exports.mongo_uri = 'mongodb://127.0.0.1:27017/meanfeed';
} else {
    console.log('Error Environment variable MEAN_ENV not set.');
    console.log('Sould be set to one of \'test\', \'development\', or \'production\'. ');
    process.exit(1);
}

exports.addFeedFollowNext = true;
exports.addFeedFollowNextMax = 10;

exports.session_secret = process.env.SESSION_SECRET || 'monkey business';

exports.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'GOOGLE_CLIENT_ID';
exports.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'GOOGLE_CLIENT_SECRET';
exports.GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'GOOGLE_CALLBACK_URL';

exports.appMountPath = '/reader/api';
