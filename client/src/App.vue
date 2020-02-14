<template>
  <div >
    <!-- <form method="post" action="http://localhost:7001/upload" enctype="multipart/form-data"> -->
    <div>
      <input type="file" name="file" @change="handleFileChange" />
    </div>
      <el-button type="primary" @click="handleUpload">上 传</el-button>
    <div>
      上传进度 <el-progress :percentage="uploadProgress"></el-progress>

    </div>

  </div>
</template>

<script>
export default {
  name: "app",
  data(){
    return {
      kkb:'xx',
      haha:"haha",
      file:null,
      uploadProgress:0
    }
  },
  async mounted(){
    let ret = await this.$axios.get('/index')
    console.log(ret)
  },
  methods:{
    handleFileChange(e) {
      const [file] = e.target.files
      if (!file) return
      this.file = file
    },
    async handleUpload(){
      if(!this.file){
        this.$message.info('请选择文件');
        return 
      }
        const form = new FormData();
        form.append("file", this.file);
        const ret = await this.$axios.post("/upload",form, {
            onUploadProgress:progress=> {
              this.uploadProgress = Number((progress.loaded / progress.total * 100).toFixed(2))
            }
        })
        this.$message.info(ret);
    }
  }
};
</script>

<style>

</style>
