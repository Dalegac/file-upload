// config/config.default.js
const path = require('path')
module.exports = appInfo => {
  const config = {};
  config.keys = 'shengxinjign@!#rocks!';
  // config.middleware = ['cors'];
  config.multipart = {
    mode: 'file',

  }
  config.security = {
    csrf: {
      enable: false
    },
  }
  config.UPLOAD_DIR = path.resolve(__dirname, "..", "target"); // 大文件存储目录

  return config;
};