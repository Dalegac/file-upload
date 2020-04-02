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
  async merge(){
    const {ext,size,hash} = this.ctx.request.body
    const filePath = path.resolve(this.config.UPLOAD_DIR, `${hash}.${ext}`)
    await this.ctx.service.upload.mergeFileChunk(filePath, hash, size)
    this.ctx.body = {
      code:0,
      msg:'合并成功'
    }

  }
  async getUploadedList(dirPath){
    return fse.existsSync(dirPath) 
      ? (await fse.readdir(dirPath)).filter(name=>name[0]!=='.') // 过滤诡异的隐藏文件 比如.DS_store
      : []
  }
  async check(){
    const { ext, hash } = this.ctx.request.body
    const filePath = path.resolve(this.config.UPLOAD_DIR, `${hash}.${ext}`)
    console.log(filePath)
    // 文件是否存在
    let uploaded = false
    let uploadedList = []
    if (fse.existsSync(filePath)) {
      // 存在文件，直接返回已上传
      uploaded = true
    }else{
      // 文件没有完全上传完毕，但是可能存在部分切片上传完毕了
      uploadedList = await this.getUploadedList(path.resolve(this.config.UPLOAD_DIR, hash))
    }

    this.ctx.body = {
      code:0,
      uploaded,
      uploadedList // 过滤诡异的隐藏文件
    }
  } 
  async upload(){
    const { ctx } = this
    if(Math.random()<0.5){
      // 随机报个错
      return ctx.status = 500;
    }
    const file = ctx.request.files[0]
    const {chunkname,ext,hash} = ctx.request.body
    console.log(file,hash,chunkname,ext)
    const filename = `${hash}.${ext}`
    // 最终文件存储位置 根据chunkname获取后缀，名字用hash
    const filePath = path.resolve(
      this.config.UPLOAD_DIR,
      filename
    )
    // 碎片文件夹，用hash命名
    const chunkPath = path.resolve(this.config.UPLOAD_DIR, hash )

    // 文件存在直接返回
    if (fse.existsSync(filePath)) {
      this.ctx.body = {
        code:-1,
        msg:'文件存在',
        url:`/public/${filename}`
      }
      return
    }
    if (!fse.existsSync(this.config.UPLOAD_DIR)) {
      await fse.mkdirs(this.config.UPLOAD_DIR)
    }
    await fse.move(file.filepath, `${chunkPath}/${chunkname}`)
    this.ctx.body={
      code:0,
      msg:'上传成功',
      url:`/public/${filename}`
    }


  }
}

module.exports = HomeController;