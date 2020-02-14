<template>
  <div class="app">
    <!-- <form method="post" action="http://localhost:7001/upload" enctype="multipart/form-data"> -->
    <div ref="drag" id="drag">
      <input type="file" name="file" @change="handleFileChange" />
      <img :src="preview" alt="">

    </div>
    <div v-loading="loading">
      <textarea ref="article" v-model="article" cols="30" rows="10"></textarea>
      <div class="output" v-html="articleHtml"></div>
    </div>
    <div v-if="file">{{file.name}}</div>

    <div>
      上传进度
      <el-progress :text-inside="true" :stroke-width="20" :percentage="uploadProgress"></el-progress>
    </div>
    <div>
      <el-button type="primary" @click="handleUpload">上 传</el-button>
    </div>
  </div>
</template>

<script>
import marked from 'marked'
const SIZE_LIMIT = 10*1024*1024 // 1M
const IMG_WIDTH_LIMIT = 1000
const IMG_HEIGHT_LIMIT = 1000
export default {
  name: "app",
  data() {
    return {
      file: null,
      uploadProgress: 0,
      preview:null,
      article:`# 蜗牛老湿开心的一天
      * 吃饭
      * 睡觉
      * 上王者
`,
      loading:false
    };
  },
  computed:{
    articleHtml(){
      return marked(this.article)
    }
  },
  async mounted() {
    // let ret = await this.$axios.get('/index')
    // console.log(ret)
    this.bindDragEvent('drag',()=>{
      this.preview = window.URL.createObjectURL(this.file)

    })
    this.bindDragEvent('article',async ()=>{
        this.loading = true
        const ret = await this.handleUpload()
        this.article += `![${this.file.name}](/api${ret.url})`
        this.loading = false

    })
    this.bindPasteEvent()
  },
  methods: {
    bindPasteEvent(){
      this.$refs.article.addEventListener('paste',async e=>{
        const files = e.clipboardData.files
        if(!files.length) return 
        this.file = files[0]
        this.loading = true
        const ret = await this.handleUpload()
        this.article += `![${this.file.name}](/api${ret.url})`
        this.loading = false

        e.preventDefault()
      })
    },
    bindDragEvent(name,cb) {
      const drag = this.$refs[name]

      drag.addEventListener("dragover", e => {
        drag.style.borderColor = "red"
        e.preventDefault()
      })
      drag.addEventListener("dragleave", e => {
        drag.style.borderColor = "#eee"
        e.preventDefault()
      })
      drag.addEventListener("drop", e => {
          const fileList = e.dataTransfer.files
          drag.style.borderColor = "#eee"
          this.file = fileList[0]; // 先只考虑单文件
          cb && cb()
          e.preventDefault()
        },
        false)
    },
    handleFileChange(e) {
      const [file] = e.target.files;
      if (!file) return;
     
      if(file.size>SIZE_LIMIT){
        this.$message.error("请选择小于2M的文件");
        return;
      }
      if(!this.isImage(file)){
        this.$message.error("请选择正确的图片格式");
        return 
      }

      this.file = file;
    },
    async blobToString(blob){
      return new Promise(resolve=>{
        const reader = new FileReader()
        reader.onload = function () {
          const ret = reader.result.split('')
                        .map(v=>v.charCodeAt())
                        .map(v=>v.toString(16).toUpperCase())
                        .map(v=>v.padStart(2,'0'))
                        .join(' ')
          resolve(ret)
        }
        reader.readAsBinaryString(blob)
      })
      // 二进制=》ascii码=》转成16进制字符串
    },
    async getRectByOffset(file,widthOffset,heightOffset,reverse){
      let width = await this.blobToString(file.slice(...widthOffset))
      let height = await this.blobToString(file.slice(...heightOffset))

      if(reverse){
        // 比如gif 的宽，6和7 是反着排的 大小端存储
        // 比如6位仕89，7位仕02， gif就是 0289 而不是8920的值 切分后翻转一下
        width = [width.slice(3,5),width.slice(0,2)].join(' ')
        height = [height.slice(3,5),height.slice(0,2)].join(' ')
      }
      const w = parseInt(width.replace(' ', ''),16)
      const h = parseInt(height.replace(' ', ''),16)
      return {w,h}
    },
    async isGif(file){
      const ret = await this.blobToString(file.slice(0,6))
      const isgif = (ret==='47 49 46 38 39 61') || (ret==='47 49 46 38 37 61')
      if(isgif){
        console.log('文件是gif')

        const {w,h} = await this.getRectByOffset(file,[6,8],[8,10],true)
        console.log('gif宽高',w,h)
        if(w>IMG_WIDTH_LIMIT || h>IMG_HEIGHT_LIMIT){
          this.$message.error("gif图片宽高不得超过！"+IMG_WIDTH_LIMIT+'和'+IMG_HEIGHT_LIMIT);
          return false
        }

      }
      return isgif
      // 文件头16进制 47 49 46 38 39 61 或者47 49 46 38 37 61
      // 分别仕89年和87年的规范
      // const tmp = '47 49 46 38 39 61'.split(' ')
      //               .map(v=>parseInt(v,16))
      //               .map(v=>String.fromCharCode(v))
      // console.log('gif头信息',tmp)
      // // 或者把字符串转为16进制 两个方法用那个都行
      // const tmp1 = 'GIF89a'.split('')
      //                 .map(v=>v.charCodeAt())
      //                 .map(v=>v.toString(16))
      // console.log('gif头信息',tmp1)
      
      // return ret ==='GIF89a' || ret==='GIF87a'
      // 文件头标识 (6 bytes) 47 49 46 38 39(37) 61

    },
    async isPng(file){
      const ret = await this.blobToString(file.slice(0,8))
      const ispng = ret==='89 50 4E 47 0D 0A 1A 0A'
      if(ispng){
        console.log('png宽高',w,h)
        const {w,h} = await this.getRectByOffset(file,[18,20],[22,24])
        if(w>IMG_WIDTH_LIMIT || h>IMG_HEIGHT_LIMIT){
          this.$message.error("png图片宽高不得超过！"+IMG_WIDTH_LIMIT+'和'+IMG_HEIGHT_LIMIT);
          return false
        }
      }
      return ispng
    },
    async isJpg(file){
      // jpg开头两个仕 FF D8
      // 结尾两个仕 FF D9
      const len = file.size
      const start = await this.blobToString(file.slice(0,2))
      const tail = await this.blobToString(file.slice(-2,len))
      const isjpg = start==='FF D8' && tail==='FF D9'
      if(isjpg){
        const heightStart = parseInt('A3',16)
        const widthStart = parseInt('A5',16)
        const {w,h} = await this.getRectByOffset(file,[widthStart,widthStart+2],[heightStart,heightStart+2])
        console.log('jpg大小',w, h)
      }
      return isjpg

    },
    isImage(file){
      return this.isGif(file) && this.isPng(file) && this.isJpg(file)

    },
    async handleUpload() {
      if (!this.file) {
        this.$message.info("请选择文件");
        return;
      }
      const form = new FormData();
      form.append("file", this.file);
      form.append("filename", this.file.name);
      const ret = await this.$axios.post("/upload", form, {
        onUploadProgress: progress => {
          this.uploadProgress = Number(
            ((progress.loaded / progress.total) * 100).toFixed(2)
          );
        }
      });
      this.$message.info(ret.msg);
      return ret
    }
  }
};
</script>

<style lang="stylus">
.app>div 
  margin 50px
#drag 
  height 100px
  border 2px dashed #eee
  line-height 100px
  text-align center
  vertical-align middle
img
  width 50px
.output
  display inline-block
  vertical-align top
  margin-left 30px
  padding 10px
  width 300px
  background  #eee
  img 
    width 200px


</style>
