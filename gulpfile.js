/*eslint-env-node*/

var gulp = require('gulp'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    eslint = require('gulp-eslint'),
    browserSync = require('browser-sync').create(),
    jasmine = require('gulp-jasmine-phantom'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    babel = require('gulp-babel'),
    sourcemaps = require('gulp-sourcemaps'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant');

gulp.task('default', ['scripts', 'scripts-dist', 'copy-html', 'copy-img', 'styles', 'lint'], () => {
  gulp.watch('sass/**/*.scss', ['styles']);
  gulp.watch('js/**/*.js', ['lint', 'scripts', 'scripts-dist']);
  gulp.watch('/index.html', ['copy-html']);
  gulp.watch('./dist/index.html')
    .on('change', browserSync.reload);

  browserSync.init({
    server: "./dist"
  });
  browserSync.stream();
});

gulp.task('styles', () => {
  gulp.src('sass/**/*.scss')
      .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
      .pipe(autoprefixer({
        browsers: ['last 2 versions']
      }))
      .pipe(gulp.dest('./dist/css'));
});

gulp.task('copy-html', () => {
  gulp.src('./index.html')
      .pipe(gulp.dest('dist'))
});

gulp.task('copy-img', () => {
  gulp.src('./img/*')
      .pipe(imagemin([
        {
          progressive: true,
          use: [pngquant()],
          
        }
      ]))
      .pipe(gulp.dest('dist/img'))
});

gulp.task('lint', () => {
  gulp.src('js/**/*.js')
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.failAfterError())
      .pipe(eslint.result(result => {
        // Called for each ESLint result.
        console.log(`ESLint result: ${result.filePath}`);
        console.log(`# Messages: ${result.messages.length}`);
        console.log(`# Warnings: ${result.warningCount}`);
        console.log(`# Errors: ${result.errorCount}`);
      }));
});

gulp.task('scripts', () => {
  gulp.src('js/**/*.js')
      .pipe(babel({
        presets: ['env']
      }))
      .pipe(concat('all.js'))
      .pipe(gulp.dest('dist/js'));
});

gulp.task('scripts-dist', () => {
  gulp.src('js/**/*.js')
      .pipe(sourcemaps.init())
      .pipe(babel({
        presets: ['env']
      }))
      .pipe(concat('all.js'))
      .pipe(uglify())
      .pipe(sourcemaps.write())
      .pipe(gulp.dest('dist/js'));
});

gulp.task('tests', () => {
  gulp.src('tests/spec/extraSpec.js')
  .pipe(jasmine({
    integration: true,
    vendor: 'js/**/*.js'
  }));
});

gulp.task('dist', () => {
  'copy-html',
  'copy-img',
  'styles',
  'lint',
  'scripts-dist'
});
