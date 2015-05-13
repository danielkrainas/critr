process.env.NODE_ENV = process.env.NODE_ENV || 'development';

module.exports = function(grunt) {
    var path = require('path');

    var mainWrapperTemplate = [
    '(function (module) {', '<%= src %>', '})(function (root) {',
        'return Object.defineProperty({}, \'exports\', {',
            'set: function (i) { root[\'<%= grunt.config(\'pkg.name\') %>\'] = i; },',
            'get: function () { return root[\'<%= grunt.config(\'pkg.name\') %>\']; }',
        '});',
    '}(this));\n'].join('\n');

    var requireStubs = [
        'var $$modules = {}',
        'var defineModule = function (name, exporter) { $$modules[name] = { exporter: exporter, ready: false }; };',
        'var require = function (name) {',
            'var m = $$modules[name];',
            'if (m && !m.ready) {',
                'm.exports = {};',
                'm.exporter.call(null, require, m, m.exports);',
                'm.ready = true;',
            '}',
            'return m && m.exports;',
        '};\n\n'
    ].join('\n');

    var moduleWrapper = ['defineModule(\'<%= name %>\', function (require, module, exports) {', '<%= src %>', '});\n'].join('\n');

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
                        exports: false,
                        module: false,
                        setTimeout: false
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
            dist: {
                options: {
                    preserveComments: 'some',
                    mangle: {
                        except: ['Critr']
                    }
                },
                files: {
                    'dist/<%= pkg.name %>.min.js': 'dist/<%= pkg.name %>.js'
                }
            },
            beautify: {
                options: {
                    preserveComments: 'some',
                    beautify: true,
                    mangle: false
                },
                files: {
                    'dist/<%= pkg.name %>.js': 'dist/<%= pkg.name %>.js'
                }
            }
        },
        concat: {
            dist: {
                options: {
                    banner: '/*! <%= pkg.name %> v<%= pkg.version %> (<%= pkg.homepage %>) */\n\n',
                    process: function (src) {
                        return grunt.template.process('\n(function () {\n<%= src %>\n}).call(this);\n', { data: { src: src }});
                    }
                },
                files: {
                    'dist/<%= pkg.name %>.js': '.build/<%= pkg.name %>.js'
                }
            },

            build: {
                options: {
                    banner: requireStubs,
                    process: function (src, filePath) {
                        var name = path.basename(filePath, '.js');
                        if (name === 'critr') {
                            return grunt.template.process(mainWrapperTemplate, { data: { src: src }});
                        }

                        return grunt.template.process(moduleWrapper, { data: { src: src, name: './' + name }});
                    }
                },
                files: {
                    '.build/<%= pkg.name %>.js': [
                        'src/utils.js',
                        'src/accumulators.js',
                        'src/operators.js',
                        'src/stages.js',
                        'src/stage-context.js',
                        'src/grouper.js',
                        'src/critr.js'
                    ]
                }
            }
        },
        mocha_istanbul: {
            coverage: {
                src: 'test/mocha',
                options: {
                    coverageFolder: '.coverage'
                }
            }
        },
        codeclimate: {
            options: {
                file: '.coverage/lcov.info',
                token: process.env.CODECLIMATE_TOKEN
            }
        },
        clean: [
            '.build',
            '.coverage',
            'dist'
        ]
    });

    if (process.env.NODE_ENV === 'development') {
        grunt.loadNpmTasks('grunt-mocha-test');
        grunt.loadNpmTasks('grunt-contrib-jshint');
        grunt.loadNpmTasks('grunt-contrib-uglify');
        grunt.loadNpmTasks('grunt-contrib-concat');
        grunt.loadNpmTasks('grunt-mocha-istanbul');
        grunt.loadNpmTasks('grunt-codeclimate');
        grunt.loadNpmTasks('grunt-contrib-clean');

        grunt.registerTask('test', ['jshint', 'mochaTest']);
        grunt.registerTask('default', 'test');
        grunt.registerTask('coverage', ['mocha_istanbul']);
        grunt.registerTask('coverage:report', ['mocha_istanbul', 'codeclimate']);
        grunt.registerTask('build', ['test', 'clean', 'concat:build', 'concat:dist', 'uglify:beautify', 'uglify:dist']);
    }
};
