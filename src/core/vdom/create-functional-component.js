/* @flow */

import VNode, { cloneVNode } from './vnode'
import { createElement } from './create-element'
import { resolveInject } from '../instance/inject'
import { normalizeChildren } from '../vdom/helpers/normalize-children'
import { resolveSlots } from '../instance/render-helpers/resolve-slots'
import { normalizeScopedSlots } from '../vdom/helpers/normalize-scoped-slots'
import { installRenderHelpers } from '../instance/render-helpers/index'

import {
  isDef,
  isTrue,
  hasOwn,
  camelize,
  emptyObject,
  validateProp
} from '../util/index'

export function FunctionalRenderContext (
  data: VNodeData,
  props: Object,
  children: ?Array<VNode>,
  parent: Component,
  Ctor: Class<Component>
) {
  const options = Ctor.options
  // ensure the createElement function in functional components
  // gets a unique context - this is necessary for correct named slot check
  let contextVm
  if (hasOwn(parent, '_uid')) {
    contextVm = Object.create(parent)
    // $flow-disable-line
    contextVm._original = parent
  } else {
    // the context vm passed in is a functional context as well.
    // in this case we want to make sure we are able to get a hold to the
    // real context instance.
    contextVm = parent
    // $flow-disable-line
    parent = parent._original
  }
  const isCompiled = isTrue(options._compiled)
  const needNormalization = !isCompiled

  this.data = data
  this.props = props
  this.children = children
  this.parent = parent
  this.listeners = data.on || emptyObject
  this.injections = resolveInject(options.inject, parent)
  this.slots = () => {
    if (!this.$slots) {
      normalizeScopedSlots(
        data.scopedSlots,
        this.$slots = resolveSlots(children, parent)
      )
    }
    return this.$slots
  }

  Object.defineProperty(this, 'scopedSlots', ({
    enumerable: true,
    get () {
      return normalizeScopedSlots(data.scopedSlots, this.slots())
    }
  }: any))

  // support for compiled functional template
  if (isCompiled) {
    // exposing $options for renderStatic()
    this.$options = options
    // pre-resolve slots for renderSlot()
    this.$slots = this.slots()
    this.$scopedSlots = normalizeScopedSlots(data.scopedSlots, this.$slots)
  }

  if (options._scopeId) {
    this._c = (a, b, c, d) => {
      const vnode = createElement(contextVm, a, b, c, d, needNormalization)
      if (vnode && !Array.isArray(vnode)) {
        vnode.fnScopeId = options._scopeId
        vnode.fnContext = parent
      }
      return vnode
    }
  } else {
    this._c = (a, b, c, d) => createElement(contextVm, a, b, c, d, needNormalization)
  }
}

installRenderHelpers(FunctionalRenderContext.prototype)

export function createFunctionalComponent (
  Ctor: Class<Component>,
  propsData: ?Object,
  data: VNodeData,
  contextVm: Component,
  children: ?Array<VNode>
): VNode | Array<VNode> | void {
  const options = Ctor.options
  const props = {}
  const propOptions = options.props

  // 如果有定义  propOptions ，遍历
  if (isDef(propOptions)) {
    for (const key in propOptions) {
      // 使用  validateProp 验证
      props[key] = validateProp(key, propOptions, propsData || emptyObject)
    }
  } else {
    // 如果没有 定义 propOptions 而是定义了其他属性 data.attr或者 data.prop 
    // mergeProps 拷贝合并
    if (isDef(data.attrs)) mergeProps(props, data.attrs)
    if (isDef(data.props)) mergeProps(props, data.props)
  }

  // FunctionalRenderContext  安装虚拟dom，事件，data，props，等，使之具有和vue一样的渲染功能
  const renderContext = new FunctionalRenderContext(
    data,
    props,
    children,
    contextVm,
    Ctor
  )

  // 定义 时候传进来的 render 生成  vnode
  const vnode = options.render.call(null, renderContext._c, renderContext)

  // 如果  vnode  instanceof  VNode  
  if (vnode instanceof VNode) {
    // 调用 方法克隆一个 vnode 
    return cloneAndMarkFunctionalResult(vnode, data, renderContext.parent, options, renderContext)
  } else if (Array.isArray(vnode)) {  // 如果 vnode  是数组
    const vnodes = normalizeChildren(vnode) || [] // normalizeChildren 创建一个规范化的子节点
    const res = new Array(vnodes.length)
    // 循环  vnodes 调用 方法
    for (let i = 0; i < vnodes.length; i++) {
      res[i] = cloneAndMarkFunctionalResult(vnodes[i], data, renderContext.parent, options, renderContext)
    }
    return res
  }
}

function cloneAndMarkFunctionalResult (vnode, data, contextVm, options, renderContext) {
  // #7817 clone node before setting fnContext, otherwise if the node is reused
  // (e.g. it was from a cached normal slot) the fnContext causes named slots
  // that should not be matched to match.
  const clone = cloneVNode(vnode)
  clone.fnContext = contextVm
  clone.fnOptions = options
  if (process.env.NODE_ENV !== 'production') {
    (clone.devtoolsMeta = clone.devtoolsMeta || {}).renderContext = renderContext
  }
  if (data.slot) {
    (clone.data || (clone.data = {})).slot = data.slot
  }
  return clone
}

function mergeProps (to, from) {
  for (const key in from) {
    to[camelize(key)] = from[key]
  }
}
