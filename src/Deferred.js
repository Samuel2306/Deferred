import QueueManagement from './QueueManagement'
import utils from './utils'
function Deferred(){
  this.cache = {

  }
  this.defaultOptions = {
    promiseQueue: [],
    recoverAuto: true,
    cxt: null,
    params: {}
  }
  // this.queueCache = []
}
Deferred.prototype = {
  constructor: Deferred,
  _merge: function(obj1,obj2){
    var obj = {}
    for(var prop in obj1){
      if(obj2[prop] == undefined){
        obj[prop] = obj1[prop]
      }else{
        obj[prop] = obj2[prop]
      }
    }
    return obj
  },
  // 单队列顺序执行
  order: function(options,key,clear){
    options = this._merge(this.defaultOptions,options)
    let queueManagement = new QueueManagement(options)
    clear = !!(clear)
    if(clear){
      this.cache[key].queueCache = this.cache[key].queueCache || []
    }else{
      this.cache[key].queueCache = []
    }
    this.cache[key].queueCache.push(queueManagement)
    return this.cache[key].queueCache
  },
  // 多队列分别顺序执行
  parallel: function(optionsArr,key,clear){
    optionsArr.forEach((options) => {
      options = this._merge(this.defaultOptions,options)
      let queueManagement = new QueueManagement(options)
      clear = !!(clear)
      if(clear){
        this.cache[key].queueCache = this.cache[key].queueCache || []
      }else{
        this.cache[key].queueCache = []
      }
      this.cache[key].queueCache.push(queueManagement)
    })
    return this.cache[key].queueCache
  },
  // 多队列顺序执行并将结果汇总到一起
  all: function(optionsArr,key,clear,f,cxt){
    var _this = this
    this.parallel(optionsArr,key,clear)
    var _start = this.start
    this.start = function(optionsArr,f,cxt) {
      let arr = this.cache[key].queueCache.map((item) => {
        return item.start()
      })
      f.after(function(){
        this.start = _start
      })
      Promise.all(arr)
        .spread(() => {
          let args = []
          for (let i = 0; i < arguments.length; i++) {
            args.push(arguments[i])
          }
          cxt = cxt == undefined ? null : cxt
          f.call(cxt, ...args)
        })
    }
  },
  getAllLinesByKey(key){
    return this.cache[key].queueCache
  },
  getLineByKeyAndIndex(key,index) {
    return this.cache[key].queueCache[index]
  },
  addLine(key,options,index){
    index = index == undefined ? this.queueCache.length : index
    options = this._merge(this.defaultOptions,options)
    var queueManagement = new QueueManagement(options)
    this.cache[key].queueCache.splice(index,0,queueManagement)
    return this.cache[key].queueCache
  },
  removeLine(key,index){
    index = index == undefined ? this.queueCache.length - 1 : index
    var item = this.cache[key].queueCache.splice(index,1)
    return item
  },
  clearLine(key){
    this.cache[key].queueCache.forEach(function(item){
      item = null
    })
    this.cache[key].queueCache = []
  },

  start(key,index){
    if(index == undefined){
      this.cache[key].queueCache.forEach((item) => {
        item.start()
      })
    }else if(utils.isNumber(index)){
      this.cache[key].queueCache[index].start()
    }else if(utils.isArray(index)){
      index.forEach((i) => {
        this.cache[key].queueCache[i].start()
      })
    }
  }
}

export default Deferred
