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
> 不敢保证所有的依赖包都写入了配置文件，如果在使用中出现了错误，那么请手动安装错误提示中需要的依赖即可


在命令行中进入项目，并运行下面的指令
```js
> gulp
```

即可启动本地开发环境

上线指令
```js
> gulp build && gulp hash && gulp cdn
```

或者运行front.sh文件
```js
> sh front.sh
```

> cdn地址可能不可用，因此会上传失败
