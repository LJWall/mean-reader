process.env.MEAN_ENV = 'test';

mongoConnect = require('../../webserv/mongoConnect');
afterAll(function () {
    mongoConnect.disconnect();
});
