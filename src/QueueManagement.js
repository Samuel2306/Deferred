import './Function'
import utils from './utils'
function OrderQueueManagement(options){
  this.promiseQueue = options.promiseQueue
  this.promiseQueueCache = []
  this.recoverAuto = options.recoverAuto == 'undefined' ? true : !!(options.recoverAuto)
  this.cxt = options.cxt
  this.params = options.params || {}
  // 出发调用链的句柄
  this.resolveFlag = null
  this.step = -1;
  this._init()
}

OrderQueueManagement.prototype = {
  constructor: OrderQueueManagement,
  // 包装函数，返回Promise对象的函数
  _wrap: function(f){
    return function(data) {
      if(this.cxt){
        f.success.bind(this.cxt,data)
        f.error.bind(this.cxt,data)
      }else{
        f.success.bind(null,data)
        f.error.bind(null,data)
      }
      return new Promise(f)
    }
  },
  _copy: function(arr1,arr2){
    arr2.forEach((item,index) => {
      if(utils.isArray(item)){
        arr1[index] = []
        this._copy(arr1[index],arr2[index])
      }else{
        arr1[index] = arr2[index]
      }
    })
  },
  // 缓存队列
  _setCache: function(arr){
    this._copy(this.promiseQueueCache,arr)
  },
  // 恢复队列
  _recoveryCache: function(arr){
    this._copy(arr,this.promiseQueueCache)
    this.step = -1
    // 重新创建调用链
    this._createLinkChain(arr)
  },
  _extendFunction(arr,params){
    params = params || this.params
    arr.forEach((queue,index) => {
      if(params != null && index == 0){
        // 为队列第一个异步操作传入参数params
        arr[index].success.extends(() => {
          return params
        },() => {
          this.step += 1
        })
      }else if(this.recoverAuto && index == arr.length -1){
        arr[index].success.after(() => {
          this.step += 1
          // 恢复队列
          this._recoveryCache()
        })
      }else{
        // 默认更新当前执行索引
        arr[index].success.after(() => {
          this.step += 1
          if(index == arr.length -1){
            this.step = -1
          }
        })
      }
    })
    return arr
  },
  // 初始化
  _init: function(){
    // 将队列参数标准化
    let arr = []
    this.promiseQueue.forEach((item) => {
      arr = arr.concat(item)
    })
    this.promiseQueue = arr.slice(0)
    this.promiseQueue.forEach((item,index) => {
      if(!utils.isObject(item)){
        this.promiseQueue[index] = {
          'success': item,
          'error': function(err){console.log(err)}
        }
      }
    })
    this.promiseQueue = this._extendFunction(this.promiseQueue)
    this._setCache(this.promiseQueue)
    this.promiseQueue = this.promiseQueue.map(this._wrap)
    this._createLinkChain(this.promiseQueue)
  },
  // 创建调用链
  _createLinkChain(queue){
    this.promiseQueue = queue.slice(0)
    var _this = this
    let promise = new Promise((resolve, reject) => {
      _this.resolveFlag = resolve
    });
    while (this.promiseQueue.length) {
      promise = promise.then(this.promiseQueue.shift.success()).catch(this.promiseQueue.shift.error());
    }
    // 捕捉错误 & 垃圾回收
    promise
      .catch(error => {
        console.log(error);
      })
  },
  // 开始执行函数
  start: function(){
    this.resolveFlag()
  },
  // 在队列中添加处理函数，可以动态添加
  /**
   *
   * @param index: 添加位置
   * @param list: 添加的函数队列
   * @param params: 为该队列预置的参数
   */
  add: function(index,list,params,auto){
    params = params || {}
    if(!utils.isArray(list)){
      list = [list]
    }
    var remainder = this.promiseQueueCache.slice(this.step + 1)
    remainder.splice(index, 0, ...list)

    remainder.forEach((item,index) => {
      if(!utils.isObject(item)){
        remainder[index] = {
          'success': item,
          'error': function(err){console.log(err)}
        }
      }
    })

    remainder = this._extendFunction(remainder,params)
    if(this.step == -1){
      this._setCache(remainder)
    }
    remainder = remainder.map(this._wrap)
    this._createLinkChain(remainder)
    if(auto){
      this.start()
    }
  },
  // 从队列中删除处理函数
  remove: function(index,num,params,auto){
    var remainder = this.promiseQueueCache.slice(this.step + 1)
    remainder.splice(index, num)

    remainder.forEach((item,index) => {
      if(!utils.isObject(item)){
        remainder[index] = {
          'success': item,
          'error': function(err){console.log(err)}
        }
      }
    })

    remainder = this._extendFunction(remainder,params)
    if(this.step == -1){
      this._setCache(remainder)
    }
    remainder = remainder.map(this._wrap)
    this._createLinkChain(remainder)
    if(auto){
      this.start()
    }
  },
  // 清空队列
  clear: function(){
    // this.promiseQueue
    this.resolveFlag = null
    this.promiseQueueCache = []
    this.promiseQueue = []
    this.params = {}
    this.step = -1
  }
}

export default OrderQueueManagement
