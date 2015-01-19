process.env.NODE_ENV = process.env.NODE_ENV || 'development';

module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        
        jshint: {
            all: {
                src: ['index.js', 'src/<%= pkg.name %>.js'],
                options: {
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
        },
        uglify: {
            options: {
                preserveComments: 'some'
            },
            dist: {
                files: {
                    'dist/<%= pkg.name %>.min.js': 'dist/<%= pkg.name %>.js'
                }
            }
        },
        concat: {
            options: {
                banner: '/*!\n * <%= pkg.name %> <%= pkg.version %>. (<%= pkg.homepage %>)\n * Copyright <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>\n */\n\n'
            },
            dist: {
                src: 'src/<%= pkg.name %>.js',
                dest: 'dist/<%= pkg.name %>.js'
            }
        }
    });

    if (process.env.NODE_ENV === 'development') {
        grunt.loadNpmTasks('grunt-mocha-test');
        grunt.loadNpmTasks('grunt-contrib-jshint');
        grunt.loadNpmTasks('grunt-contrib-uglify');
        grunt.loadNpmTasks('grunt-contrib-concat');

        grunt.registerTask('test', ['mochaTest']);
        grunt.registerTask('default', ['jshint', 'test']);
        grunt.registerTask('build', ['test', 'concat:dist', 'uglify:dist']);
    }
};
