/* @flow */

import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'

let uid = 0

export function initMixin (Vue: Class<Component>) {
  /** 然后init 一个方法 */
  Vue.prototype._init = function (options?: Object) {
    // vm === this
    const vm: Component = this
    // a uid
    // 在this上定义了属性_uid
    vm._uid = uid++

    let startTag, endTag
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }

    // a flag to avoid this being observed
    // 在this上定义了属性_isVue
    vm._isVue = true
    // merge options
    // 判断有没有定义options，是否为 component
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options) // 是component , 调用 initInternalComponent
    } else {
      // 使用mergeOptions处理传入的参数,返回值给vm.$options赋值；
      // 第一个参数是Vue.options;第二个参数是我们调用Vue构造函数的参数选项;第三个参数vm即this

      // 如果不是组件，将两个组件对象合并  成一个
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor), // 合并 vm
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm) // 代理监听Vue获取值，
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    // 生产环境下会为实例添加两个属性，并且属性值等于本身;vm._renderProxy = vm;vm._self = vm;因为vm = this

    // 添加了$parent、$children、$refs、_watcher、_inactive、_directInactive、_isMounted、_isDestroyed、_isBeingDestroyed等属性
    initLifecycle(vm) // 确认组件得父子关系 // 初始化生命周期等标识
    initEvents(vm) // 对on ，@ 呀这些事件进行得一个注册// 初始化组件事件
    // Vue渲染
    initRender(vm) // 初始化渲染

    // 调用了钩子函数--beforeCreate
    callHook(vm, 'beforeCreate')
    initInjections(vm) // resolve injections before data/props  // 初始化  injections
    // 初始化State, --- 对data，props，computed等属性进行初始化
    initState(vm) // 初始化状态

    // 为provide 选项应该是一个对象或返回一个对象的函数。该对象包含可注入其子孙的属性，用于组件之间通信
    initProvide(vm) // resolve provide after data/props

    // 调用钩子函数--created
    callHook(vm, 'created') // 触发钩子函数  created

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    // 如果没有传入options的el属性，则需要手动mount
    if (vm.$options.el) {
      
      vm.$mount(vm.$options.el) // $mount 手动挂载 一个未挂载的实例
    }
  }
}

export function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

export function resolveConstructorOptions (Ctor: Class<Component>) {
  let options = Ctor.options
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

function resolveModifiedOptions (Ctor: Class<Component>): ?Object {
  let modified
  const latest = Ctor.options
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}
