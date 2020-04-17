import attrs from './attrs'
import klass from './class'
import events from './events'
import style from './style'
import transition from './transition'

// platformModules
export default [
  attrs, // update 、 create 更新  attr属性  设置真实DOM属性
  klass, // update 、 create 更新 class
  events, // update 、 create 更新 dom 事件
  style, // update 、 create 更新 dom 样式
  transition // create 、 activate 、 remove 三个方法
]
