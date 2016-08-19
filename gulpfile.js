"use strict";

var $           = require('gulp-load-plugins')();
var argv        = require('yargs').argv;
var gulp        = require('gulp');
var browserSync = require('browser-sync').create();
var merge       = require('merge-stream');
var sequence    = require('run-sequence');
var colors      = require('colors');
var dateFormat  = require('dateformat');
var del         = require('del');

// Enter URL of your local server here
// Example: 'http://localwebsite.dev'
var URL = '';

// port
var PORT = 3001;

// Check for --production flag
var isProduction = !!(argv.production);

// Browsers to target when prefixing CSS.
var COMPATIBILITY = ['last 2 versions', 'ie >= 9'];

// File paths to various assets are defined here.
var PATHS = {
  sass: [
    'assets/libs/foundation-sites/scss',
    'assets/libs/motion-ui/src',
    'assets/libs/font-awesome/scss'
  ],
  javascript: [
    'assets/libs/what-input/what-input.js',
    'assets/libs/foundation-sites/js/foundation.core.js',
    'assets/libs/foundation-sites/js/foundation.util.*.js',

    // Paths to individual JS libs defined below
    'assets/libs/foundation-sites/js/foundation.abide.js',
    'assets/libs/foundation-sites/js/foundation.accordion.js',
    'assets/libs/foundation-sites/js/foundation.accordionMenu.js',
    'assets/libs/foundation-sites/js/foundation.drilldown.js',
    'assets/libs/foundation-sites/js/foundation.dropdown.js',
    'assets/libs/foundation-sites/js/foundation.dropdownMenu.js',
    'assets/libs/foundation-sites/js/foundation.equalizer.js',
    'assets/libs/foundation-sites/js/foundation.interchange.js',
    'assets/libs/foundation-sites/js/foundation.magellan.js',
    'assets/libs/foundation-sites/js/foundation.offcanvas.js',
    'assets/libs/foundation-sites/js/foundation.orbit.js',
    'assets/libs/foundation-sites/js/foundation.responsiveMenu.js',
    'assets/libs/foundation-sites/js/foundation.responsiveToggle.js',
    'assets/libs/foundation-sites/js/foundation.reveal.js',
    'assets/libs/foundation-sites/js/foundation.slider.js',
    'assets/libs/foundation-sites/js/foundation.sticky.js',
    'assets/libs/foundation-sites/js/foundation.tabs.js',
    'assets/libs/foundation-sites/js/foundation.toggler.js',
    'assets/libs/foundation-sites/js/foundation.tooltip.js',

    // Motion UI
    'assets/libs/motion-ui/motion-ui.js',

    // Include your own custom scripts (located in the custom folder)
    'assets/javascript/custom/*.js'
  ],
  pkg: [
    '**/*',
    '!**/node_modules/**',
    '!**/libs/**',
    '!**/scss/**',
    '!**/bower.json',
    '!**/gulpfile.js',
    '!**/package.json',
    '!**/composer.json',
    '!**/composer.lock',
    '!**/codesniffer.ruleset.xml',
    '!**/packaged/*'
  ]
};

// Browsersync task
gulp.task('browser-sync', ['build'], function() {

  var files = [
            '**/*.php',
            'assets/images/**/*.{png,jpg,gif}',
          ];

  browserSync.init(files, {
    // Proxy address
    proxy: URL,
    // Port #
    port: PORT
  });
});

// Compile Sass into CSS
// In production, the CSS is compressed
gulp.task('sass', function() {
  // Minify CSS if run wtih --production flag

  return gulp.src('assets/scss/app.scss')
    .pipe($.sourcemaps.init())
    .pipe($.sass({ includePaths: PATHS.sass})).on('error', $.notify.onError({ message: "<%= error.message %>", title: "Sass Error"}))
    .pipe($.autoprefixer({ browsers: COMPATIBILITY}))
    .pipe($.if(isProduction, $.minifyCss()))
    .pipe($.if(!isProduction, $.sourcemaps.write('.')))
    .pipe(gulp.dest('assets/css'))
    .pipe(browserSync.stream({match: '**/*.css'}));
});

// Lint all JS files in custom directory
gulp.task('lint', function() {
  return gulp.src('app/*.js')
    .pipe($.jshint())
    .pipe($.notify(function (file) {
      if (file.jshint.success) {
        return false;
      }

      var errors = file.jshint.results.map(function (data) {
        if (data.error) {
          return "(" + data.error.line + ':' + data.error.character + ') ' + data.error.reason;
        }
      }).join("\n");
      return file.relative + " (" + file.jshint.results.length + " errors)\n" + errors;
    }));
});

// Combine JavaScript into one file
// In production, the file is minified
gulp.task('javascript', function() {
  var uglify = $.uglify()
    .on('error', $.notify.onError({
      message: "<%= error.message %>",
      title: "Uglify JS Error"
    }));

  return gulp.src(PATHS.javascript)
    .pipe($.sourcemaps.init())
    .pipe($.concat('ng-wordpress-libs.js'))
    .pipe($.if(isProduction, uglify))
    .pipe($.if(!isProduction, $.sourcemaps.write()))
    .pipe(gulp.dest('assets/javascript'))
    .pipe(browserSync.stream());
});

// Copy task
gulp.task('copy', function() {
  // Motion UI
  var motionUi = gulp.src('assets/libs/motion-ui/**/*.*')
    .pipe($.flatten())
    .pipe(gulp.dest('assets/javascript/vendor/motion-ui'));

  // What Input
  var whatInput = gulp.src('assets/libs/what-input/**/*.*')
      .pipe($.flatten())
      .pipe(gulp.dest('assets/javascript/vendor/what-input'));

  // Font Awesome
  var fontAwesome = gulp.src('assets/libs/font-awesome/fonts/**/*.*')
      .pipe(gulp.dest('assets/fonts'));

  return merge(motionUi, whatInput, fontAwesome);
});

// Package task
gulp.task('package', ['build'], function() {
  var fs = require('fs');
  var time = dateFormat(new Date(), "yyyy-mm-dd_HH-MM");
  var pkg = JSON.parse(fs.readFileSync('./package.json'));
  var title = pkg.name + '_' + time + '.zip';

  return gulp.src(PATHS.pkg)
    .pipe($.zip(title))
    .pipe(gulp.dest('packaged'));
});

// Build task
// Runs copy then runs sass & javascript in parallel
gulp.task('build', ['clean'], function(done) {
  sequence('copy', ['sass', 'javascript', 'lint'], done);
});

// Clean task
gulp.task('clean', function(done) {
  sequence(['clean:javascript', 'clean:css'], done);
});

// Clean JS
gulp.task('clean:javascript', function() {
  return del(['assets/javascript/ng-wordpress-libs.js']);
});

// Clean CSS
gulp.task('clean:css', function() {
  return del([
      'assets/stylesheets/app.css',
      'assets/stylesheets/app.css.map'
    ]);
});

// Default gulp task
// Run build task and watch for file changes
gulp.task('default', ['build', 'browser-sync'], function() {
  // Log file changes to console
  function logFileChange(event) {
    var fileName = require('path').relative(__dirname, event.path);
    console.log('[' + 'WATCH'.green + '] ' + fileName.magenta + ' was ' + event.type + ', running tasks...');
  }

  // Sass Watch
  gulp.watch(['assets/scss/**/*.scss'], ['clean:css', 'sass'])
    .on('change', function(event) { logFileChange(event); });

  // JS Watch
  gulp.watch(['assets/javascript/**/*.js', 'gulpfile.js', '!*.mp4'], ['clean:javascript', 'javascript', 'lint'])
    .on('change', function(event) { logFileChange(event); });

});
