module.exports = function(grunt) {
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        
        jshint: {
            all: {
                src: ['index.js', 'src/critr.js'],
                options: {
                    jshintrc: true,
                    globalstrict: true,
                    globals: {
                        require: false,
                        __dirname: false,
                        exports: false
                    }
                }
            }
        },
        
        mochaTest: {
            options: {
                reporter: 'spec'
            },
            src: ['test/mocha/*.js']
        }
    });

    grunt.registerTask('default', ['jshint', 'test']);

    grunt.registerTask('test', ['mochaTest']);
};
