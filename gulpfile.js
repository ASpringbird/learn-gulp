'use strict';

// node 模块
var fs = require('fs');
var path = require('path');
var through = require('through2');
var del = require('del');
var gulp = require('gulp');

// 错误捕获
var plumber = require('gulp-plumber');

// css
var less = require('gulp-less');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var csscomb = require('gulp-csscomb');
var minifycss = require('gulp-minify-css');
var cssbeautify = require('gulp-cssbeautify');

// js
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var jshint = require('gulp-jshint');

// 图像处理
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var spritesmith = require('gulp.spritesmith');
var imgcache = require('gulp-imgcache');

// 提示
var notify = require("gulp-notify");
var header = require('gulp-header');
var footer = require('gulp-footer');

var foreach = require('gulp-foreach');

// 自动刷新
var livereload = require('gulp-livereload');

var gutil = require('gulp-util');
var sort = require('gulp-sort');
var hash = require('gulp-hash');
var replace = require('gulp-replace');
var rsync = require('gulp-rsync');

var pkg = require('./package.json');
var cdnHost = pkg.cdn.host;
var cdnPath = '/' + pkg.cdn.path.split('/').filter(function(name){
    return !!name;
}).join('/') || '/activity-demo';
var cdnUrl = cdnHost + cdnPath;

var paths = {
	css: './style',
	js: './js',
	img: './images',
	build: './build',
	configFile: './config.static.json',
    corejs: 'js/main.js'
}

var oldStaticConfig
try {
    oldStaticConfig = require(paths.configFile) || {};
} catch (e) {
    oldStaticConfig = {};
}

var comment = "/*!\n * " + ['@author: ' + pkg.author].join("\n * ") + "\n */\n\n";

gulp.task('css', function() {
	// .{}中的多个项中间不要加空格
	return gulp.src(paths.css + '/**/!(_)*.{less,sass,scss}')
		.pipe(plumber({
			errorHandler: handleError
		}))

		// 编译less/scss
		.pipe(foreach(function(stream, file) {
            return stream
                .pipe(path.extname(file.relative) == '.less' ? less() : sass().on('error', sass.logError));
        }))

		// 添加前缀
		.pipe(autoprefixer({
            cascade: false,
            browsers: ['Firefox >= 10', 'iOS >= 4', 'Chrome >= 10']
        }))

		// css样式排序优化，
		.pipe(csscomb())

		// 压缩css
		.pipe(minifycss({
			aggressiveMerging: false,   // 是否暴力合并
            advanced: false,            // 是否开启高级优化
            compatibility: 'ie7',       // 保留ie7写法
            keepBreaks: true            // 是否换行
		}))

		// 将压缩之后css样式还原成为未压缩的状态，因为csscomb排序之后有一些不必要的空行
		.pipe(cssbeautify({
            autosemicolon: true
        }))
		.pipe(gulp.dest(paths.css))
        .pipe(livereload({
            quiet: true
        }))
        .pipe(notify({
            onLast: true,
            message: "browser reload for css"
        }));
})

// 该任务没有做具体的文件操作，主要目的是在html改变保存时页面会自动刷新
gulp.task('html', function() {
    return gulp.src(['**/!(_)*.{html,php}', '!{build,'+ paths.js +', '+ paths.css +', '+ paths.img +', node_modules}/**'])
        .pipe(plumber({
            errorHandler: handleError
        }))
        .pipe(one())
        .pipe(livereload({
            quiet: true
        }))
        .pipe(notify({
            onLast: true,
            message: "browser reload for html"
        }));
});

// 同上，监听图片的改变并刷新页面
// 如果无法在指定地址中发现一个符合要求的文件，那么会报错如下
// Error: Cannot read property 'path' of undefined
gulp.task('image', function() {
    var src = paths.img + '/**/!(_)*.{jpg,jpeg,png,gif,svg,webp}';
    return gulp.src(src)
        .pipe(plumber({
            errorHandler: handleError
        }))
        .pipe(one())
        .pipe(livereload({
            quiet: true
        }))
        .pipe(notify({
            onLast: true,
            message: "browser reload for image"
        }));
});

gulp.task('js', function() {

	// 需要被合并的js文件从配置文件中获取
    var src = pkg.js.map(function(js){
        return paths.js + '/dev/' +js;
    });
    return gulp.src(src)
        .pipe(plumber({
            errorHandler: handleError
        }))

		// 将src中的所有文件按照先后顺序合并成为main.js
        .pipe(concat('main.js'))
        .pipe(gulp.dest(paths.js))
        .pipe(livereload({
            quiet: true
        }))
        .pipe(notify({
            onLast: true,
            message: "browser reload for js"
        }));
});

// 构建css，与上面的css任务有细微的差别
gulp.task('buildCss', function() {
    return gulp.src([paths.css + '/**/!(_)*.{less,scss,sass}'])
        .pipe(plumber({
            errorHandler: handleError
        }))
        .pipe(foreach(function(stream, file) {
            return stream
                .pipe(path.extname(file.relative) == '.less' ? less() : sass().on('error', sass.logError));
        }))
        .pipe(autoprefixer({
            cascade: false,
            browsers: ['Firefox >= 10', 'iOS >= 4', 'Chrome >= 10']
        }))
        .pipe(csscomb())
        .pipe(minifycss({
            compatibility: 'ie7',
            keepSpecialComments: 0,  // 是否保留特殊前缀，如果为0，表示不保存， ‘*’表示保留
            keepBreaks: false
        }))

		// 在文件顶部添加一些说明信息，具体为comment的值
        .pipe(header(comment))
        .pipe(gulp.dest(paths.build + '/' + paths.css))
        .pipe(notify({
            onLast: true,
            message: "build css complete!"
        }));
});

gulp.task('buildJs', function() {
    var src = pkg.js.map(function(js){
        return paths.js + '/dev/' +js;
    });
    return gulp.src(src)
        .pipe(plumber({
            errorHandler: handleError
        }))
        .pipe(concat('main.js'))
        .pipe(uglify())
        .pipe(header(comment))
        .pipe(gulp.dest(paths.build + '/' + paths.js))
        .pipe(notify({
            onLast: true,
            message: "build js complete!"
        }));
});

gulp.task('buildImage', function() {
    return gulp.src(paths.img + '/**/!(_)*.{jpg,jpeg,png,gif,svg,webp}')
        .pipe(plumber({
            errorHandler: handleError
        }))
		// 图片压缩
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{
                removeViewBox: false
            }],
            use: [pngquant()]
        }))
        .pipe(gulp.dest(paths.build + '/' + paths.img))
        .pipe(notify({
            onLast: true,
            message: "build images complete!"
        }));
});

gulp.task('buildHtml', function() {
    return gulp.src(['**/!(_)*.{html,php}', '!{build,'+ paths.js +', '+ paths.css +', '+ paths.img +', node_modules}/**'])
        .pipe(plumber({
            errorHandler: handleError
        }))
        .pipe(gulp.dest(paths.build))
        .pipe(notify({
            onLast: true,
            message: "buld html complete!"
        }));
});

// 删除目录下相关文件
gulp.task('buildClean', function(cb) {
    del([paths.build + '/**'], cb);
});

gulp.task('hash', function() {
    var staticConfig = {};
    var fileCount = 0;
    var staticMap = {};

    return gulp.src([paths.build + '/**/*.{html,js,css,png,jpg,jpeg,gif,webp,svg}', '!' + paths.build + '/dist/**'])
        .pipe(plumber({
            errorHandler: handleError
        }))
		// 给识别到的所有文件排序
        .pipe(sort(function(file1, file2) {
            var extname1 = path.extname(file1.relative),
                extname2 = path.extname(file2.relative);
            if (extname1 == '.html') {
                return 1;
            }

            if (extname1 == '.css') {
                return extname2 == '.html' ? -1 : 1;
            }

            if (file1.relative == paths.corejs) {
                return extname2 == '.html' ? -1 : 1;
            }

            if (file2.relative == paths.corejs) {
                return -1;
            }

            if (extname2 == '.css') {
                return -1;
            }

            return file1.relative <= file2.relative ? -1 : 1;
        }))
        .pipe(foreach(function(stream, file) {
            var relative = file.relative;
            var oldPath = file.path;
            var extname = path.extname(relative);
            var isCorejs = relative == paths.corejs;

            if (isCorejs) {
                stream = stream.pipe(header('window.STATIC_MAP=' + JSON.stringify(staticMap) + ';\n\n'));
            }

			// 将路径引用替换成hash值之后的路径，通常只会有css与html文件中会有这样的路径
            return extname ? stream
                .pipe(extname == '.css' ? replace(/(?:src=|url\(\s*)['"]?([^'"\)(\?|#)]+)['"]?\s*\)?/gm, function(match, src) {
                    var imgPath = path.relative('../', path.normalize(src));
                    if (staticConfig[imgPath]) {
                        return match.replace(src, cdnUrl + '/' + staticConfig[imgPath]);
                    }
                    return match;
                }) : extname == '.html' ? replace(/<(?:link|img|script)[^>]*?(?:href|src)\s*=\s*['"]?([^'"{}>\)(\?|#)]+)['"]?/gm, function(match, src) {
                    var filePath = path.relative('./', path.normalize(src));
                    if (staticConfig[filePath]) {
                        return match.replace(src, cdnUrl + '/' + staticConfig[filePath]);
                    }
                    return match;
                }) : gutil.noop())
                .pipe(extname == '.html' ? gutil.noop() : hash({
                    template: '<%= name %>.<%= hash %><%= ext %>'
                }))
                .pipe(extname == '.html' ? gulp.dest(paths.build) : one(function() {

					// 生成一个文件名对应文件名的json
					staticConfig[relative] = file.relative;
                    staticMap[relative] = cdnUrl + '/' + file.relative;
                    //del(oldPath);
                })) : stream;
        }))
        .pipe(gulp.dest(paths.build + '/dist'))
        .pipe(one(function() {

			// 获得新hash文件名
            var staticConfigSort = {};
            Object.keys(staticConfig).sort().forEach(function(key) {
                staticConfigSort[key] = staticConfig[key];
            });
			// 生成一个json配置文件，该文件中文件路径名为key值，文件hash名为value值
            fs.writeFileSync(paths.build + '/config.static.json', JSON.stringify(staticConfigSort, null, '\t'), 'utf-8');
        }))
        .pipe(notify({
            onLast: true,
            message: "静态资源打包处理完毕！"
        }));
});

gulp.task('cdn', function() {
    var failNum = 0;
    var exitsNum = 0;
    var uploadNum = 0;
    var files = [];

    return gulp.src(paths.build + '/dist/**/*.{js,css,png,jpg,jpeg,gif,webp,svg}')
        .pipe(plumber({
            errorHandler: handleError
        }))
        .pipe(through.obj(function(file, enc, cb) {
            var dirname = path.dirname(file.relative),
                extname = path.extname(file.relative),
                basename = path.basename(file.relative, extname);

            if (file._contents) {
                if (oldStaticConfig[dirname + '/' + basename.split('.').slice(0, -1).join('.') + extname] == file.relative) {
                    exitsNum++;
                    console.log(gutil.colors.green('已存在：' + file.relative));
                } else {
                    files.push(file);
                }
            }

            cb();
        }, function(cb) {
            var self = this;
            var delay = 0;

            if (files.length) {
                files.forEach(function(file) {
                    var error;
                    setTimeout(function() {
                        gulp.src(file.path)
                            .pipe(plumber({
                                errorHandler: function(err) {
                                    failNum++;
                                    error = true;
                                    gutil.beep();
                                    console.log(gutil.colors.red('上传失败(' + err.message + ')：' + file.relative));
                                    this.emit('end');
                                }
                            }))
                            .pipe(rsync({
                                root: paths.build + '/dist',
                                silent: true,
                                hostname: 'static',
                                compress: true,
                                destination: '/data0/webservice/static' + cdnPath
                            }))
                            .pipe(one(function() {
                                if (!error) {
                                    uploadNum++;
                                    console.log(gutil.colors.magenta('已上传：' + file.relative));
                                }

                                if (uploadNum + failNum == files.length) {
                                    showResult(cb);
                                }
                            }));
                    }, delay += 100);
                    self.push(file);
                });
            } else {
                showResult(cb);
            }
        }));

		function showResult(cb) {
	        console.log(gutil.colors[failNum ? 'red' : 'cyan']('+++++++++++++++++++++++++++++++\n 文件上传完毕(' + gutil.colors.blue(cdnPath) + ') \n ' + gutil.colors.magenta('成功：' + uploadNum) + ' \n ' + gutil.colors.red('失败:' + failNum) + ' \n ' + gutil.colors.green('重复：' + exitsNum) + '\n+++++++++++++++++++++++++++++++'));
	        if (!failNum) {
	            fs.writeFileSync(paths.configFile, fs.readFileSync(paths.build + '/config.static.json'), 'utf-8');
	            del([paths.build + '/dist', paths.build + '/config.static.json'], function(){
	                console.log(gutil.colors.blue("配置文件已经更新: " + path.resolve(paths.configFile)));
	                cb();
	            });
	        } else {
	            console.log(gutil.colors.red("文件未全部上传，请单独运行") + gutil.colors.green(' gulp cdn ') + gutil.colors.red("命令!"));
	            cb();
	        }
	    }
});

gulp.task('watch', function() { //监听文件改变触发相应任务
    livereload.listen();

    gulp.watch(['**/*.{html,php}', '!{build,'+ paths.js +', '+ paths.css +', '+ paths.img +'}/**/*.{html,php}'], ['html']);
    gulp.watch([paths.js + '/dev/**/*.js'], ['js']);
    gulp.watch(paths.css + '/**/*.{less,sass,scss}', ['css']);
    gulp.watch(paths.img + '/**/*.{jpg,jpeg,png,gif,svg,webp}', ['image']);
});

gulp.task('default', ['watch']);
gulp.task('build', ['buildClean'], function() {
    gulp.start('buildHtml', 'buildCss', 'buildImage', 'buildJs');
});

// 错误回调
function handleError(err) {
    gutil.beep();
    gutil.log(err.toString());
    notify.onError("Error: <%= error.message %>")(err);
    this.emit('end');
}


// 合并多个文件流，只执行最后一个
function one(callback) {
    var last;
    return through.obj(function(file, enc, cb) {
        last = file;
        cb();
    }, function(cb) {
        this.push(last);
        callback && callback();
        cb();
    });
}

function all() {
    var files = [];
    return through.obj(function(file, enc, cb) {
        files.push(file);
        cb();
    }, function(cb) {
        var self = this;
        files.forEach(function(file) {
            self.push(file);
        });
        cb();
    });
}
