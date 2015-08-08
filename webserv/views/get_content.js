var db = require('../mongoConnect.js');

module.exports = function (req, res) {
    var q = {_id: req.params.ObjectID};
    db.content.findOneAsync(q)
    .then(function (item) {
        if (item) {
            res.status(200).type('html').set('cache-control', 'public, max-age=604800').send(item.content);
        } else {
            res.status(404).end();
        }
    });
};
