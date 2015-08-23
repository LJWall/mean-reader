module.exports = function (req, res, next) {
  var error = procDate(req, 'updated_since')||
              procDate(req, 'older_than') ||
              procInt(req, 'N') ||
              procBool(req, 'starred');

  if (error) {
    res.status(400).send(error);
  } else {
    next();
  }
};

function procDate (req, queryItem) {
  if (req.query[queryItem]) {
    var dt = new Date(req.query[queryItem]);
    if (isNaN(dt.getTime())) {
      return parseErrMsg(queryItem, 'date');
    }
    req.query[queryItem] = dt;
  }
}

function procInt (req, queryItem) {
  if (req.query[queryItem]) {
    var n = parseInt(req.query[queryItem]);
    if (isNaN(n)) {
      return parseErrMsg(queryItem, 'integer');
    }
    req.query[queryItem] = n;
  }
}

function procBool (req, queryItem) {
  var s;
  if (req.query[queryItem]) {
    s = req.query[queryItem].toLowerCase();
    if (s === 'true') {
      req.query[queryItem] = true;
    } else if (s === 'false') {
      req.query[queryItem] = false;
    } else {
      return parseErrMsg(queryItem, 'boolean');
    }
  }
}


function parseErrMsg (queryItem, type) {
    return 'Cannot parse ' + queryItem + ' query parameter as ' + type + '.';
}
