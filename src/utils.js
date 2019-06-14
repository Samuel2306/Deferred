let utils = {
  isArray: function(arr){
    return Object.prototype.toString.call(arr) === '[object Array]'
  },
  isObject: function(obj){
    return Object.prototype.toString.call(obj) === '[object Object]'
  },
  isNumber: function(num){
    return Object.prototype.toString.call(num) === '[object Number]'
  }
}

export default utils
