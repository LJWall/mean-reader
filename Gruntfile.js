module.exports = function(grunt) {
    
    var config = {};

    // Load grunt packages and create blank section of the config object.  
    grunt.loadNpmTasks('grunt-contrib-copy'); 
    config.copy = {};
    grunt.loadNpmTasks('grunt-express-server'); 
    config.express = {};
    grunt.loadNpmTasks('grunt-contrib-watch'); 
    config.watch = {};
    grunt.loadNpmTasks('grunt-bower-concat');
    config.bower_concat = {};
    grunt.loadNpmTasks('grunt-closure-compiler');
    config['closure-compiler'] = {};
    grunt.loadNpmTasks('grunt-contrib-jshint');
    config.jshint = {};

    // Bower dependencies 
    config.bower_concat.all = {
        dest: 'frontend_build/js/bower.js',
        cssDest: 'frontend_build/css/bower.css',
        callback: function(mainFiles, component) {
            return mainFiles.map(function(filepath) {
                // Use minified files if available
                var min = filepath.replace(/\.js$/, '.min.js');
                return grunt.file.exists(min) ? min : filepath;
            });
        }
    };
    config.watch.bower = {files: ['bower.json'], tasks: ['bower_concat:all']};
    
    // JavaScript
    config['closure-compiler'].all = {
        js: 'frontend_src/**.js',
        jsOutputFile: 'frontend_build/js/frontend.min.js',
        reportFile: 'closure-compiler.report.txt', 
        options: {compilation_level: 'SIMPLE', language_in: 'ECMASCRIPT5_STRICT'}
    };
    config.watch.js = {files: ['frontend_src/*.js'], tasks: ['closure-compiler:all']};

    // HTML
    config.copy.html = {files: [{expand: true, filter: 'isFile', flatten: true, src: 'frontend_src/*.html', dest: 'frontend_build/'}] };
    config.watch.html = {files: ['frontend_src/*.html'], tasks: ['copy:html']};

    // Own CSS
    config.copy.css = {files: [{expand: true, filter: 'isFile', flatten: true, src: 'frontend_src/*.css', dest: 'frontend_build/css'}] };
    config.watch.css = {files: ['frontend_src/*.css'], tasks: ['copy:css']};
    
    // Server
    config.express = { options: {script: 'webserv/main.js'}, dev: {}};
    config.watch.server = {files: ['webserv/*.js', 'webserv/**/*.js'], tasks: ['express:dev:stop', 'express:dev'], options: {spawn: false}};

    // jshint
    config.jshint.all = ['Gruntfile.js', 'frontend_src/**/*.js', 'spec/**/*.js', 'webserv/**/*.js'];


    grunt.initConfig(config);

    grunt.registerTask('build', ['bower_concat', 'copy', 'closure-compiler']);
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
            //jasmine.onComplete(function(passed) {
            //    done(passed);
            //});
            jasmine.env.addReporter({
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

};
