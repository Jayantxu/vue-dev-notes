/* @flow */

import { updateListeners } from 'core/vdom/helpers/update-listeners'

let target: any

// 柯里化函数，返回一个直接调用函数的方法，然后 remove
function createOnceHandler (event, handler, capture) {
  const _target = target // save current target element in closure
  return function onceHandler () {
    const res = handler.apply(null, arguments)
    if (res !== null) {
      remove(event, onceHandler, capture, _target)
    }
  }
}

function add (
  event: string,
  handler: Function,
  capture: boolean,
  passive?: boolean,
  params?: Array<any>
) {
  if (capture) {
    console.log('Weex do not support event in bubble phase.')
    return
  }
  target.addEvent(event, handler, params)
}

function remove (
  event: string,
  handler: any,
  capture: any,
  _target?: any
) {
  (_target || target).removeEvent(event)
}

function updateDOMListeners (oldVnode: VNodeWithData, vnode: VNodeWithData) {
  if (!oldVnode.data.on && !vnode.data.on) {
    return
  }
  const on = vnode.data.on || {}
  const oldOn = oldVnode.data.on || {}
  target = vnode.elm // 获取真实DOM
  updateListeners(on, oldOn, add, remove, createOnceHandler, vnode.context) // 更新事件
  target = undefined
}

export default {
  create: updateDOMListeners,
  update: updateDOMListeners
}
