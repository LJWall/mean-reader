module.exports = function(grunt) {
    
    var config = {};

    // Load grunt packages and create blank section of the config object.  
    grunt.loadNpmTasks('grunt-contrib-copy'); 
    config.copy = {};
    grunt.loadNpmTasks('grunt-express-server'); 
    config.express = {};
    grunt.loadNpmTasks('grunt-contrib-watch'); 
    config.watch = {};
    grunt.loadNpmTasks('grunt-closure-compiler');
    config['closure-compiler'] = {};
    grunt.loadNpmTasks('grunt-contrib-jshint');
    config.jshint = {};
    grunt.loadNpmTasks('grunt-contrib-less');
    config.less= {};
    grunt.loadNpmTasks('grunt-contrib-concat');
    config.concat = {};

    // (some) Bower dependencies
    config.copy.bower = { files: [
        {expand: true, flatten: true, src: 'bower_components/angular/angular.*', dest: 'frontend_build/js'},
        {expand: true, flatten: true, src: 'bower_components/jquery/dist/jquery.*', dest: 'frontend_build/js'},
        {expand: true, flatten: true, src: 'bower_components/ngInfiniteScroll/build/ng-infinite-scroll.*', dest: 'frontend_build/js'},
        {expand: true, flatten: true, src: 'bower_components/font-awesome/css/font-awesome.*', dest: 'frontend_build/css'},
        {expand: true, flatten: true, src: 'bower_components/font-awesome/fonts/*', dest: 'frontend_build/fonts'}
    ]};

    // frontend JavaScript (minified and optimised)
    config['closure-compiler'].all = {
        js: 'frontend_src/js/**/*.js',
        jsOutputFile: 'frontend_build/js/frontend.min.js',
        reportFile: 'closure-compiler.report.txt', 
        options: {compilation_level: 'SIMPLE', language_in: 'ECMASCRIPT5_STRICT'}
    };

    // frontend Javascript (basic concat)
    config.concat.frontendjs = {
        src: ['frontend_src/js/**/*.js'],
        dest: 'frontend_build/js/frontend.js'
    };

    config.watch.js = {files: ['frontend_src/**/*.js'], tasks: ['closure-compiler:all', 'concat']};

    // Angual tempales
    config.copy.htmlTemplates = {files: [{expand: true, filter: 'isFile', flatten: true, src: 'frontend_src/js/**/*.html', dest: 'frontend_build/js'}] };
    config.watch.htmlTemplates = {files: ['frontend_src/**/*.html'], tasks: ['copy:htmlTemplates']};

    // HTML
    config.copy.html = {files: [{expand: true, filter: 'isFile', flatten: true, src: 'frontend_src/*.html', dest: 'frontend_build/'}] };
    config.watch.html = {files: ['frontend_src/*.html'], tasks: ['copy:html']};
    config.copy.favicon = {files: [{src: 'frontend_src/favicon.ico', dest: 'frontend_build/favicon.ico'}] };

    // Own LESS/CSS
    config.less.all = {
        options: { paths: ['bower_components/bootstrap/less'] },
        files: {'frontend_build/css/reader.css': 'frontend_src/less/index.less'}
    };
    config.watch.less = {files: ['frontend_src/less/**/*.less'], tasks: ['less']};

    // Server
    config.express = { options: {script: 'webserv/main.js'}, dev: {}};
    config.watch.server = {files: ['webserv/*.js', 'webserv/**/*.js'], tasks: ['express:dev:stop', 'express:dev'], options: {spawn: false}};

    // jshint
    config.jshint.all = ['Gruntfile.js', 'frontend_src/**/*.js', 'spec/**/*.js', 'webserv/**/*.js'];


    grunt.initConfig(config);

    grunt.registerTask('build', ['less', 'copy', 'closure-compiler', 'concat']);
    grunt.registerTask('default',['build']);
    grunt.registerTask('run', ['build', 'express:dev', 'watch']);
    
    grunt.registerTask("testnode",
        "Run server specs in Node.js",
        function() {
            var done = this.async(),
                Jasmine = require('jasmine'),
                jasmine = new Jasmine(),
                pass = true; 

            jasmine.loadConfigFile('./spec/support/jasmine.json');
            jasmine.env.addReporter({
                specDone: function (result) {
                    pass = pass && result.status!=='failed';
                },
                suiteDone: function (result) {
                    pass = pass && result.status!=='failed';
                },
                jasmineDone: function() {
                    done(pass);
                }
            });

            jasmine.execute();
        }
    );
    grunt.registerTask('test', ['jshint', 'testnode']);

};
