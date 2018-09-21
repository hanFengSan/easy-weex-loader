# easy-weex-loader
这是一个为EasyWeex服务的webpack loader.

## Features
* 为weex提供环境变量. process.env.NODE_ENV映射到weex.config.env.NODE_ENV
* 用EasyWeex编写的vue单组件文件的template里, 提供_styles变量映射到styles, 使得使用起来更加直观.
