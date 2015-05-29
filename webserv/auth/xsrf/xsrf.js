var uid_safe = require('uid-safe');
    
module.exports.get_xsrf_token = function (req, res) {
    uid_safe(50)
    .then(function (uid) {
        res.cookie('XSRF-TOKEN', uid, {httpOnly: false});
        req.session['XSRF-TOKEN'] = uid;
        res.status(200).end();
    })
    .catch(function () {
        res.status(500).end();
    });
};
 
module.exports.check_xsrf_header = function (req, res, next) {
    if (!req.headers['X-XSRF-TOKEN'] || req.headers['X-XSRF-TOKEN'] !== req.session['XSRF-TOKEN']) {
        res.status(401).end();
    } else
    {
        next();
    }
};

