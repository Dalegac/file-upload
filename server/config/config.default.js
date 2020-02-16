// config/config.default.js
const path = require('path')
module.exports = appInfo => {
  const config = {};
  config.keys = 'shengxinjign@!#rocks!';
  // config.middleware = ['cors'];
  config.multipart = {
    mode: 'file',
    // multipart: {
    // },
      whitelist: ()=>true


  }
  config.security = {
    csrf: {
      enable: false
    },
  }
  config.UPLOAD_DIR = path.resolve(__dirname, "..", "app/public"); // 大文件存储目录

  return config;
};