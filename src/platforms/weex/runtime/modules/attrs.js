/* @flow */

import { extend } from 'shared/util'


// 更新设置真实DOM属性值，通过新旧Vnode 对比
function updateAttrs (oldVnode: VNodeWithData, vnode: VNodeWithData) {
  if (!oldVnode.data.attrs && !vnode.data.attrs) {
    return
  }
  let key, cur, old
  const elm = vnode.elm
  const oldAttrs = oldVnode.data.attrs || {}
  let attrs = vnode.data.attrs || {}
  // clone observed objects, as the user probably wants to mutate it
  if (attrs.__ob__) {
    attrs = vnode.data.attrs = extend({}, attrs)
  }

  // 比较新 Vnode 和 旧 Vnode 中的属性
  // 如果不相等则设置属性，更新属性值
  // 如果新 Vnode 属性中没有， 则删除属性值

  const supportBatchUpdate = typeof elm.setAttrs === 'function'
  const batchedAttrs = {}
  for (key in attrs) {
    cur = attrs[key]
    old = oldAttrs[key]
    if (old !== cur) {
      supportBatchUpdate
        ? (batchedAttrs[key] = cur)
        : elm.setAttr(key, cur)
    }
  }
  for (key in oldAttrs) {
    
    if (attrs[key] == null) {
      supportBatchUpdate
        ? (batchedAttrs[key] = undefined)
        : elm.setAttr(key)
    }
  }
  if (supportBatchUpdate) {
    elm.setAttrs(batchedAttrs)
  }
}

export default {
  create: updateAttrs,
  update: updateAttrs // 更新设置真实 DOM 属性
}
