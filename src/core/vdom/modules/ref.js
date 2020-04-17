/* @flow */

import { remove, isDef } from 'shared/util'

// ref 有 create 、 update 、 destroy， 都是去 调用 redisterRef
export default {
  
  create (_: any, vnode: VNodeWithData) {
    registerRef(vnode)
  },
  // 更新 ref
  update (oldVnode: VNodeWithData, vnode: VNodeWithData) {
    // 先删除 ref， 再添加 ref
    if (oldVnode.data.ref !== vnode.data.ref) {
      registerRef(oldVnode, true)
      registerRef(vnode)
    }
  },
  destroy (vnode: VNodeWithData) {
    //  删除 ref
    registerRef(vnode, true)
  }
}

// registerRef，注册或删除 ref，如果注册，则加入  $ref，并存入真实DOM
export function registerRef (vnode: VNodeWithData, isRemoval: ?boolean) {
  const key = vnode.data.ref
  if (!isDef(key)) return

  const vm = vnode.context
  const ref = vnode.componentInstance || vnode.elm
  const refs = vm.$refs
  if (isRemoval) {
    // 删除
    if (Array.isArray(refs[key])) {
      remove(refs[key], ref)
    } else if (refs[key] === ref) {
      refs[key] = undefined
    }
  } else {
    if (vnode.data.refInFor) {
      if (!Array.isArray(refs[key])) {
        refs[key] = [ref]
      } else if (refs[key].indexOf(ref) < 0) {
        // $flow-disable-line
        refs[key].push(ref)
      }
    } else {
      refs[key] = ref
    }
  }
}
