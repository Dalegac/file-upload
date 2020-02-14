import Vue from 'vue'
import App from './App.vue'
import axios from 'axios'
import './plugins/element.js'

let request = axios.create({
  baseURL:"/api"
})


request.interceptors.response.use(
  async response=>{
    // header config这里处理就可以了，应用层只需要数据data
    let {data} = response
    // if(dat)
    return data

  }
)
Vue.prototype.$axios = request
Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
