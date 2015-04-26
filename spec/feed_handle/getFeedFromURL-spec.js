var feed_server = require('./test_atomserv/feed_server'),
    getFeedFromURL = require('../../webserv/feed_handle/utils/getFeedFromURL.js')

    
describe('getFeedFromURL', function () {    
    it('should get the atom data from the test atom server', function (done){
        feed_server.startServer();
        getFeedFromURL('http://127.0.0.1:1337/surf.atom')
        .then(function (data) {
            expect(data.meta.title).toEqual('A Board, Some Wax and a Leash');
            expect(data.items).toContain(jasmine.objectContaining({title: 'Life vs Surfing'}));
            expect(data.items.length).toEqual(25);
        })
        .done(done);  
    });
});

