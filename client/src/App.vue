<template>
  <div class="app">

    <input type="text">
    <i class="el-icon-loading" style="color:#F56C6C;"></i>

    <!-- <form method="post" action="http://localhost:7001/upload" enctype="multipart/form-data"> -->
    <div ref="drag" id="drag">
      <input type="file" name="file" @change="handleFileChange" />
      <!-- <img :src="preview" alt=""> -->
    </div>
    <!-- <div v-loading="loading">
      <textarea ref="article" v-model="article" cols="30" rows="10"></textarea>
      <div class="output" v-html="articleHtml"></div>
    </div>
    <div v-if="file">{{file.name}}</div> -->

    <div>
      上传进度
    </div>
      <el-progress :text-inside="true" :stroke-width="20" :percentage="uploadProgress"></el-progress>

          <div>文件准备中</div>
          <div>
      <el-progress :text-inside="true" :stroke-width="20" :percentage="hashProgress"></el-progress>

          </div>
      {{hashProgress}}
    <div> 
      <el-button type="primary" @click="handleUpload">上 传</el-button>
    </div>
        <div> 
      <el-button type="primary" @click="handleUpload1">慢启动上传</el-button>
    </div>





    <!-- 方块进度条 -->

      <div class="cube-container" :style="{width:cubeWidth+'px'}">
        <div class="cube" 

          v-for="chunk in chunks" 
          :key="chunk.name">
          <div           
            :class="{
            'uploading':chunk.progress>0&&chunk.progress<100, 
            'success':chunk.progress==100,
            'error':chunk.progress<0,
            }" 
            :style="{height:chunk.progress+'%'}"
            >
            <i v-if="chunk.progress<100 &&chunk.progress>1" class="el-icon-loading" style="color:#F56C6C;"></i>
          </div>
        </div>
      </div>

  </div>
</template>

<script>
import marked from 'marked'
import sparkMd5 from 'spark-md5'
const CHUNK_SIZE = 1*1024*1024 // 1M
const IMG_WIDTH_LIMIT = 1000
const IMG_HEIGHT_LIMIT = 1000
export default {
  name: "app",
  data() {
    return {
      chunks:[],
      file: null,
      hash:null,
      preview:null,
      article:`# 蜗牛老湿开心的一天
      * 吃饭
      * 睡觉
      * 上王者
`,
      loading:false,
      hashProgress:0
    };
  },
  computed:{
    articleHtml(){
      return marked(this.article)
    },
    cubeWidth(){
      return Math.ceil(Math.sqrt(this.chunks.length))*16
    },
    uploadProgress() {
      if (!this.file || !this.chunks.length) return 0;
      const loaded = this.chunks
        .map(item => item.chunk.size * item.progress)
        .reduce((acc, cur) => acc + cur);
      return parseInt((loaded / this.file.size).toFixed(2));
    }
  },
  async mounted() {
    // this.bindDragEvent('drag',()=>{
    //   this.preview = window.URL.createObjectURL(this.file)

    // })
    // this.bindDragEvent('article',async ()=>{
    //     this.loading = true
    //     const ret = await this.handleUpload()
    //     this.article += `![${this.file.name}](/api${ret.url})`
    //     this.loading = false

    // })
    // this.bindPasteEvent()
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
     
      // if(file.size>CHUNK_SIZE){
      //   this.$message.error("请选择小于2M的文件");
      //   return;
      // }
      // if(!this.isImage(file)){
      //   this.$message.error("请选择正确的图片格式");
      //   return 
      // }

      this.file = file;
    },
    async blobToData(blob){
      return new Promise(resolve=>{
        const reader = new FileReader()
        reader.onload = function () {
          resolve(reader.result)
        }
        reader.readAsBinaryString(blob)
      })
      // 二进制=》ascii码=》转成16进制字符串
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
    createFileChunk(file,size=CHUNK_SIZE){
      // 生成文件块 Blob.slice语法
      const chunks = [];
      let cur = 0;
      while (cur < file.size) {
        chunks.push({index:cur, file: file.slice(cur, cur + size)});
        cur += size;
      }
      return chunks;
    },
    ext(filename){
      // 返回文件后缀名
      return filename.split('.').pop()
    },
    async calculateHash(file){
      // 直接计算md5 大文件会卡顿
      const ret = await this.blobToData(file)
      return sparkMd5.hash(ret)
    },
    // web-worker
    async calculateHashWorker(chunks) {
      return new Promise(resolve => {
        // web-worker 防止卡顿主线程
        this.worker = new Worker("/hash.js");
        this.worker.postMessage({ chunks });
        this.worker.onmessage = e => {
          const { progress, hash } = e.data;
          this.hashProgress = Number(progress.toFixed(2));
          if (hash) {
            resolve(hash);
          }
        };
      });
    },
    async calculateHashSample() {
      return new Promise(resolve => {
        const spark = new sparkMd5.ArrayBuffer();
        const reader = new FileReader();
        const file = this.file;
        // 文件大小
        const size = this.file.size;
        let offset = 2 * 1024 * 1024;

        let chunks = [file.slice(0, offset)];

        // 前面100K

        let cur = offset;
        while (cur < size) {
          // 最后一块全部加进来
          if (cur + offset >= size) {
            chunks.push(file.slice(cur, cur + offset));
          } else {
            // 中间的 前中后去两个字节
            const mid = cur + offset / 2;
            const end = cur + offset;
            chunks.push(file.slice(cur, cur + 2));
            chunks.push(file.slice(mid, mid + 2));
            chunks.push(file.slice(end - 2, end));
          }
          // 前取两个子杰
          cur += offset;
        }
        // 拼接
        reader.readAsArrayBuffer(new Blob(chunks));

        // 最后100K
        reader.onload = e => {
          spark.append(e.target.result);
          this.hashProgress = 100
          resolve(spark.end());
        };
      });
    },
    async calculateHashIdle(chunks) {
      return new Promise(resolve => {
        const spark = new sparkMd5.ArrayBuffer();
        let count = 0;
        const appendToSpark = async file => {
          return new Promise(resolve => {
            const reader = new FileReader();
            reader.readAsArrayBuffer(file);
            reader.onload = e => {
              spark.append(e.target.result);
              resolve();
            };
          });
        };
        const workLoop = async deadline => {
          // 有任务，并且当前帧还没结束
          while (count < chunks.length && deadline.timeRemaining() > 1) {
            await appendToSpark(chunks[count].file);
            count++;
            // 没有了 计算完毕
            if (count < chunks.length) {
              // 计算中
              this.hashProgress = Number(
                ((100 * count) / chunks.length).toFixed(2)
              );
              // console.log(this.hashProgress)
            } else {
              // 计算完毕
              this.hashProgress = 100;
              resolve(spark.end());
            }
          }
          console.log(`浏览器有任务拉，开始计算${count}个，等待下次浏览器空闲`)

          window.requestIdleCallback(workLoop);
        };
        window.requestIdleCallback(workLoop);
      });
    },
    async handleUpload1(){
      // @todo数据缩放的比率 可以更平缓  
      // @todo 并发+慢启动

      // 慢启动上传逻辑 
      const file = this.file
      if (!file) return;
      const fileSize = file.size
      let offset = 0.1*1024*1024 

      let cur = 0 
      let count =0
      this.hash = await this.calculateHashSample();

      while(cur<fileSize){
        const chunk = file.slice(cur, cur+offset)
        cur+=offset
        const chunkName = this.container.hash + "-" + count;
        const form = new FormData();

          form.append("chunkname", chunkName)
          form.append("ext", this.ext(this.file.name))
          form.append("hash", this.hash)
          // form.append("file", new File([chunk],name,{hash,type:'png'}))


        let start = new Date().getTime()
        await this.$axios.post( '/upload', form)
        const now = new Date().getTime()

        const time = ((now -start)/1000).toFixed(4)

        // 期望10秒一个切片
        let rate = time/10
        // 速率有最大和最小 可以考虑更平滑的过滤 比如1/tan 
        if(rate<0.5) rate=0.5
        if(rate>2) rate=2
        // 新的切片大小等比变化
        console.log(`切片${count}大小是${this.format(offset)},耗时${time}秒，是30秒的${rate}倍，修正大小为${this.format(offset/rate)}`)
        offset = parseInt(offset/rate)
        // if(time)
        count++
      }



    },

    // async calculateHash
    async handleUpload() {
      if (!this.file) {
        this.$message.info("请选择文件");
        return;
      }
      let chunks = this.createFileChunk(this.file);

      // 计算hash 文件指纹标识
      // this.hash = await this.calculateHash(this.file)
      // web-worker
      // this.hash = await this.calculateHashWorker(chunks)
      // requestIdleCallback
      // this.hash = await this.calculateHashIdle(chunks)
      
      // 抽样哈希，牺牲一定的准确率 换来效率，hash一样的不一定是同一个文件， 但是不一样的一定不是 
      // 所以可以考虑用来预判
      this.hash = await this.calculateHashSample()

      // 检查文件是否已经上传
      const { uploaded, uploadedList } = await this.$axios.post('/check',{
          ext:this.ext(this.file.name),
          hash:this.hash
        }
      )
      if(uploaded){
        return this.$message.success("秒传:上传成功")
      }
      // 切片

      this.chunks = chunks.map((chunk,index)=>{
        // 每一个切片的名字
        const chunkName = this.hash+'-'+index
        return {
          hash:this.hash,
          chunk:chunk.file,
          name:chunkName,
          index,
          // 设置进度条
          progress: uploadedList.indexOf(chunkName) > -1 ? 100 : 0,
        }
      })
      // 传入已经存在的切片清单
      await this.uploadChunks(uploadedList);

    },
    async mergeRequest(){
      await this.$axios.post("/merge", {
        ext: this.ext(this.file.name),
        size: CHUNK_SIZE,
        hash: this.hash
      });
    },
    sendRequest(chunks, limit=4){
      return new Promise((resolve,reject)=>{
        const len = chunks.length
        let counter = 0
        // 全局开关
        let isStop = false 


        const start = async ()=>{

          if(isStop){
            return 
          }
          const task = chunks.shift()
          if(task){
            const {form,index} = task
            try{
              await this.$axios.post('/upload',form, {
                onUploadProgress: progress => {
                  this.chunks[index].progress = Number(((progress.loaded / progress.total) * 100).toFixed(2));
                }
              })
              if(counter==len-1){
                // 最后一个
                resolve()
              }else{
                counter++
                start()
              }
            }catch(e){
              // 当前切片报错了
              // 尝试3次重试机制，重新push到数组中
              console.log('出错了')
              // 进度条改成红色
              this.chunks[index].progress = -1
              if(task.error<3){
                task.error++
                // 队首进去 准备重试
                chunks.unshift(task)
                start()
              }else{
                // 错误3次了 直接结束
                isStop=true
                reject()
              }
            }

          }
        }

        while(limit>0){
          setTimeout(()=>{
            // 模拟延迟
            start()
          }, Math.random()*2000)

          limit-=1
        }



      })

    },
    async uploadChunks(uploadedList=[]){
      const list = this.chunks
        .filter(chunk => uploadedList.indexOf(chunk.name) == -1)
        .map(({ chunk,name, hash, index }, i) => {
          const form = new FormData();
          form.append("chunkname", name)
          form.append("ext", this.ext(this.file.name))
          form.append("hash", hash)
          // form.append("file", new File([chunk],name,{hash,type:'png'}))
          form.append("file",chunk)

          return { form, index,error:0}
        })
      //   .map(({ form, index }) =>this.$axios.post('/upload',form, {
      //     onUploadProgress: progress => {
      //       this.chunks[index].progress = Number(((progress.loaded / progress.total) * 100).toFixed(2));
      //     }
      //   }))
      // await Promise.all(list);
      try{
        await this.sendRequest([...list],4)
        if(uploadedList.length + list.length === this.chunks.length){
          await this.mergeRequest()
        }
      }catch(e){
        this.$message.error('上传似乎除了点小问题，重试试试哈')
      }

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

.cube-container
  width 100px
  overflow hidden
.cube
  width 14px
  height 14px
  line-height 12px;
  border 1px solid black
  background  #eee
  float left
  >.success
    background #67C23A
  >.uploading
    background #409EFF
  >.error
    background #F56C6C

</style>
