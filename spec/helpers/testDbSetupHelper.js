mongoConnect = require('../../webserv/mongoConnect');

mongoConnect.uri = 'mongodb://127.0.0.1:27017/testwomble';

afterAll(function () {
    mongoConnect.disconnect();
});
