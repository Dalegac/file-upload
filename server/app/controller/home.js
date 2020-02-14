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
    const { ctx } = this
    const file = ctx.request.files[0];
    console.log(file)
    const filePath = path.resolve(
      this.config.UPLOAD_DIR,
      file.filename
    )
    console.log(filePath)

    // 文件存在直接返回
    if (fse.existsSync(filePath)) {
      this.ctx.body = {
        code:-1,
        msg:'文件存在',
        url:'/public/'+file.filename

      }
      return
    }
    if (!fse.existsSync(this.config.UPLOAD_DIR)) {
      await fse.mkdirs(this.config.UPLOAD_DIR)
    }
    await fse.move(file.filepath, filePath)
    this.ctx.body={
      code:0,
      msg:'上传成功',
      url:'/public/'+file.filename
    }


  }
}

module.exports = HomeController;