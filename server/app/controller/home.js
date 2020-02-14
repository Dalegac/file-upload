// app/controller/home.js
const path = require('path')
const fse = require("fs-extra")

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    this.ctx.body = {
      msg:'hello eggjs'
    }
  }
  async upload(){
    const { ctx } = this;
    const file = ctx.request.files[0];

    const filePath = path.resolve(
      this.config.UPLOAD_DIR,
      file.filename
    )
    // 文件存在直接返回
    if (fse.existsSync(filePath)) {
      this.ctx.body = '文件存在'
      return
    }
    if (!fse.existsSync(this.config.UPLOAD_DIR)) {
      await fse.mkdirs(this.config.UPLOAD_DIR)
    }
    await fse.move(file.filepath, filePath)
    this.ctx.body='上传成功'
  }
}

module.exports = HomeController;