// config/config.default.js
const path = require("path");
module.exports = (appInfo) => {
  const config = {};
  config.keys = "shengxinjign@!#rocks!";
  // config.middleware = ['cors'];
  config.security = {
    csrf: {
      enable: false,
    },
  };
  config.UPLOAD_DIR = path.resolve(__dirname, "..", "app/public"); // 大文件存储目录

  config.multipart = {
    mode: "file",
    // fieldNameSize: 100, //字段名称长度限制     fieldSize: '1mb', //字段值长度大小限制，比如富文本有时添加多媒体后就会很大，此处要调高限制。
    // fields: 50, //字段数量限制
    fileSize: "200mb", //上传文件大小限制
    whitelist: [
      //无拓展名文件上传
      "",
      // images 支持
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".bmp",
      ".wbmp",
      ".webp",
      ".tif",
      ".psd", // text

      ".svg",
      ".js",
      ".jsx",
      ".json",
      ".css",
      ".less",
      ".html",
      ".htm",
      ".xml", // tar

      ".zip",
      ".gz",
      ".tgz",
      ".gzip", // video

      ".mp3",
      ".mp4",
      ".avi",
    ],
    // files: 10, //上传文件数量限制
  };
  return config;
};
