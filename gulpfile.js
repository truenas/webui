'use strict';

var gulp = require('gulp');
var clangFormat = require('clang-format');
var gulpFormat = require('gulp-clang-format');


gulp.task('format', function() {
  var format = require('gulp-clang-format');
  var clangFormat = require('clang-format');
  return gulp.src(['**/*.ts'], { base: '.' }).pipe(
    format.format('file', clangFormat)).pipe(gulp.dest('.'));
});

gulp.task('default',['format']);
