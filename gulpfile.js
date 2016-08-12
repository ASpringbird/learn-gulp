'use strict';

var gulp = require('gulp');

// css 相关插件
var sass         = require('gulp-sass');         // 编译sass
var autoprefixer = require('gulp-autoprefixer'); // 补全前缀
var csscomb      = require('gulp-csscomb');      // 格式化css样式，排序
var cssbeautify  = require('gulp-cssbeautify');  // 美化css样式
var minifycss    = require('gulp-minify-css');   // 压缩css文件

var livereload   = require('gulp-livereload');


// 错误捕获
var plumber = require('gulp-plumber');

gulp.task('css', function() {
	gulp.src('./style/*.scss')
		.pipe(plumber())
		.pipe(sass())
		.pipe(autoprefixer({
			browsers: ['last 2 versions', 'Android >= 4.0'],
			cascade: true, //是否美化属性值 默认：true 像这样：
                           //-webkit-transform: rotate(45deg);
                           //        transform: rotate(45deg);
            remove:true //是否去掉不必要的前缀 默认：true
		}))
		.pipe(csscomb())
		.pipe(minifycss({
			aggressiveMerging: false,
            advanced: false,            //类型：Boolean 默认：true [是否开启高级优化（合并选择器等）]
            compatibility: 'ie7',       //保留ie7及以下兼容写法 类型：String 默认：''or'*' [启用兼容模式； 'ie7'：IE7兼容模式，'ie8'：IE8兼容模式，'*'：IE9+兼容模式]
            keepBreaks: true,           //类型：Boolean 默认：false [是否保留换行]
			keepSpecialComments: '*'    //保留所有特殊前缀 当你用autoprefixer生成的浏览器前缀，如果不加这个参数，有可能将会删除你的部分前缀
		}))
		.pipe(gulp.dest('./style/'))
		.pipe(livereload({
            quiet: true
        }));
});

gulp.task('watch', function() {
	livereload.listen();

	gulp.watch('./style/*.scss', ['css']);
})

gulp.task('default', ['watch']);
