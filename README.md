# learn-gulp

欢迎大家关注learn-gulp项目

#### 使用步骤

fork项目到自己的github上，然后通过ssh key的方式克隆项目到本地电脑    

或者直接通过https的方式克隆项目到本地
```js
git clone https://github.com/yangbo5207/learn-gulp.git
```

安装依赖包
```js
npm install
```

实现的效果，改变style目录中的scss文件，index.html中的效果会自动刷新。

> 请确保浏览器中已经安装了livereload插件，并且插件的空心圆被点击变成成了实心圆。

在命令行中进入项目，并运行下面的指令
```js
> gulp
```

运行过程提示大致如下
```js
➜  learn-gulp git:(master) ✗ gulp
[16:39:02] Using gulpfile ~/develop/me/learn-gulp/gulpfile.js
[16:39:02] Starting 'watch'...
[16:39:02] Finished 'watch' after 13 ms
[16:39:02] Starting 'default'...
[16:39:02] Finished 'default' after 7.08 μs
```

> 如果在使用过程中发现有插件没有安装，依照微信公众号文章中的方式，将对应插件安装好即可
