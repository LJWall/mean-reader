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

    // Bower dependencies 
    config.bower_concat.all = {dest: 'frontend_build/js/bower.js', cssDest: 'frontend_build/css/bower.css'};
    config.watch.bower = {files: ['bower.json'], tasks: ['bower_concat:all']};
    
    // Own JavaScript
    config.copy.js = {files: [{expand: true, filter: 'isFile', flatten: true, src: 'frontend_src/*.js', dest: 'frontend_build/js'}] };
    config.watch.js = {files: ['frontend_src/*.js'], tasks: ['copy:js']};

    // HTML
    config.copy.html = {files: [{expand: true, filter: 'isFile', flatten: true, src: 'frontend_src/*.html', dest: 'frontend_build/'}] };
    config.watch.html = {files: ['frontend_src/*.html'], tasks: ['copy:html']};

    // Own CSS
    config.copy.css = {files: [{expand: true, filter: 'isFile', flatten: true, src: 'frontend_src/*.css', dest: 'frontend_build/css'}] };
    config.watch.css = {files: ['frontend_src/*.css'], tasks: ['copy:css']};
    
    // Server
    config.express = { options: {script: 'webserv/main.js'}, dev: {}},
    config.watch.server = {files: ['webserv/*.js', 'webserv/**/*.js'], tasks: ['express:dev:stop', 'express:dev'], options: {spawn: false}}

    grunt.initConfig(config);
    grunt.registerTask('build', ['bower_concat', 'copy']);
    grunt.registerTask('default',['build']);
    grunt.registerTask('run', ['build', 'express:dev', 'watch']);
    
};
