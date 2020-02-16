// app/service/upload.js
const path = require('path')
const fse = require('fs-extra')
const Service = require('egg').Service;

class UploadService extends Service {

  extractExt(filename) {
    return filename.slice(filename.lastIndexOf("."), filename.length)
  }
  async mergeFiles(files, dest, size) {
    const pipeStream = (filePath, writeStream) =>
      new Promise(resolve => {
        const readStream = fse.createReadStream(filePath)
        readStream.on("end", () => {
          // 删除文件
          fse.unlinkSync(filePath)
          resolve()
        })
        readStream.pipe(writeStream)
      })

    await Promise.all(
      files.map((file, index) =>
        pipeStream(
          file,
          // 指定位置创建可写流 加一个put避免文件夹和文件重名
          // hash后不存在这个问题，因为文件夹没有后缀
          // fse.createWriteStream(path.resolve(dest, '../', 'out' + filename), {
          fse.createWriteStream(dest, {
            start: index * size,
            end: (index + 1) * size
          })
        )
      )
    )

  }

  async mergeFileChunk(filePath, fileHash, size){
    const chunkDir = path.resolve(this.config.UPLOAD_DIR, fileHash)
    let chunkPaths = await fse.readdir(chunkDir)
    // 根据切片下标进行排序
    // 否则直接读取目录的获得的顺序可能会错乱
    chunkPaths
      .sort((a, b) => a.split("-")[1] - b.split("-")[1])
    chunkPaths = chunkPaths.map(cp => path.resolve(chunkDir, cp)) // 转成文件路径
    await this.mergeFiles(chunkPaths, filePath, size)
  }
}
module.exports = UploadService;