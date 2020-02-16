// app/service/upload.js
const Service = require('egg').Service;

class UploadService extends Service {

    extractExt(filename){
        return filename.slice(filename.lastIndexOf("."), filename.length)
    }

    //   async find(uid) {
//     const user = await this.ctx.db.query('select * from user where uid = ?', uid);
//     return user;
//   }
}

module.exports = UploadService;