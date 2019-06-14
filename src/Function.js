// 为函数绑定前置函数
Function.prototype.after = function(afterFn,cxt){
  cxt = cxt || null
  var _self = this // 保留原函数的引用
  return function(){
    var args = arguments
    var res = _self.call(cxt,args)
    afterFn.call(cxt,args,res)
  }
}
// 为函数绑定后置函数
Function.prototype.before = function(beforeFn,cxt){
  cxt = cxt || null
  var _self = this // 保留原函数的引用
  return function(){
    var args = arguments
    var res = beforeFn.call(cxt,args)
    _self.call(cxt,args,res)
  }
}


Function.prototype.extends = function(beforeFn,afterFn,cxt){
  cxt = cxt || null
  var _self = this // 保留原函数的引用
  return function(){
    var args = arguments
    var res = beforeFn.call(cxt,args)
    res = _self.call(cxt,args,res)
    afterFn.call(cxt,args,res)
  }
}
