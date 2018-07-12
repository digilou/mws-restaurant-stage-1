/*eslint-env-node*/

var gulp = require('gulp'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    eslint = require('gulp-eslint'),
    browserSync = require('browser-sync').create(),
    jasmine = require('gulp-jasmine-phantom');

gulp.task('default', ['styles', 'lint'], () => {
  gulp.watch('sass/**/*.scss', ['styles']);
  gulp.watch('js/**/*.js', ['lint']);

  browserSync.init({
    server: "./"
  });
  browserSync.stream();
});

gulp.task('styles', () => {
  gulp.src('sass/**/*.scss')
  .pipe(sass().on('error', sass.logError))
  .pipe(autoprefixer({
    browsers: ['last 2 versions']
  }))
  .pipe(gulp.dest('./css'));
});

gulp.task('lint', () => {
  gulp.src('js/**/*.js')
  .pipe((eslint()))
  .pipe(eslint.format())
  .pipe(eslint.failAfterError());
});

gulp.task('tests', () => {
  gulp.src('tests/spec/extraSpec.js')
  .pipe(jasmine({
    integration: true,
    vendor: 'js/**/*.js'
  }));
})
