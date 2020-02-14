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
      this.file = file;
    },
    async handleUpload() {
      console.log(this.file)
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
