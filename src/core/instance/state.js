/* @flow */
/**
 * 对props、methods、data、computed 等属性进行初始化
 */
import config from '../config'
import Watcher from '../observer/watcher'
import Dep, { pushTarget, popTarget } from '../observer/dep'
import { isUpdatingChildComponent } from './lifecycle'

import {
  set,
  del,
  observe,
  defineReactive,
  toggleObserving
} from '../observer/index'

import {
  warn,
  bind,
  noop,
  hasOwn,
  hyphenate,
  isReserved,
  handleError,
  nativeWatch,
  validateProp,
  isPlainObject,
  isServerRendering,
  isReservedAttribute
} from '../util/index'

// 
const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
}
// ^
// |
// *数据代理*
// 接收initData传入的三个参数: vm, `_data`, key， prop的sourceKey传_props; data的传_data
export function proxy (target: Object, sourceKey: string, key: string) {
  // 做数据劫持,似乎用sourceKey搞了个属性内属性~;;;; ----- 目的：将target[sourceKey][key]读写变为target[key]
  sharedPropertyDefinition.get = function proxyGetter () {
    return this[sourceKey][key]
  }
  sharedPropertyDefinition.set = function proxySetter (val) {
    this[sourceKey][key] = val
  }
  /**
   * 通过 Object.defineProperty 把 
   * target[_data / _prop ][key] 的读写变成了对 _data / prop[key] 的读写。
   * 对于 vm._data.xxxx 我们可以访问到定义在 data 函数返回对象中的属性，
   * 所以我们就可以通过 vm.xxxx 访问到定义在 data 函数返回对象中的 xxxx 属性了。
   */
  Object.defineProperty(target, key, sharedPropertyDefinition)
}


export function initState (vm: Component) {
  vm._watchers = [] // 为  vue 实例 vm 添加 _watchers观察者队列
  const opts = vm.$options
  // # initProp的时候
  if (opts.props) initProps(vm, opts.props)  // 初始化props
  if (opts.methods) initMethods(vm, opts.methods) // 初始化事件，校验事件的 key 有没有和 props 属性一样，
  // 挂载数据 # initData的时候
  if (opts.data) {
    initData(vm) // 初始化数据
  } else {
    observe(vm._data = {}, true /* asRootData */)
  }
  if (opts.computed) initComputed(vm, opts.computed) // 初始化计算属性
  // 如果 options 中有 watch，用户定义了watch
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch) // 初始化 Watch
  }
}

function initProps (vm: Component, propsOptions: Object) {
  const propsData = vm.$options.propsData || {}
  const props = vm._props = {}
  // cache prop keys so that future props updates can iterate using Array
  // instead of dynamic object key enumeration.
  const keys = vm.$options._propKeys = []
  const isRoot = !vm.$parent
  // root instance props should be converted
  if (!isRoot) {
    toggleObserving(false)
  }
  // 遍历props数据, 
  // 目的一：L109的defineReactive方法变为响应式、
  // 目的二、L115的proxy方法，挂载再vm上,可以通过this访问
  for (const key in propsOptions) { // 循环propsOptions 的key
    keys.push(key)

    // 调用  validateProp 验证props 是否符合规范，
    const value = validateProp(key, propsOptions, propsData, vm)
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      const hyphenatedKey = hyphenate(key)
      if (isReservedAttribute(hyphenatedKey) ||
          config.isReservedAttr(hyphenatedKey)) {
        warn(
          `"${hyphenatedKey}" is a reserved attribute and cannot be used as component prop.`,
          vm
        )
      }
      defineReactive(props, key, value, () => {
        if (!isRoot && !isUpdatingChildComponent) {
          warn(
            `Avoid mutating a prop directly since the value will be ` +
            `overwritten whenever the parent component re-renders. ` +
            `Instead, use a data or computed property based on the prop's ` +
            `value. Prop being mutated: "${key}"`,
            vm
          )
        }
      })
    } else {
      // 将 props 属性加入观察者
      defineReactive(props, key, value)
    }
    // static props are already proxied on the component's prototype
    // during Vue.extend(). We only need to proxy props defined at
    // instantiation here.
    if (!(key in vm)) {  // 如果 key 不在  this 中， 则加入 vm 中
      proxy(vm, `_props`, key)
    }
  }
  toggleObserving(true)
}

// Vue的data数据响应系统
/**
 * 目的一、对data函数返回的对象进行遍历，并且通过proxy挂载在this（vm）上--L181
 * 目的二、调用observe观测data变化 ---- Line189
 */

function initData (vm: Component) {
  // 找出Vue上的data属性
  let data = vm.$options.data

  // 在mergeOptions合并处理后的mergeInstanceDataFn函数，所以判断了一下data是不是function
  // 把data 推出来成为obj
  data = vm._data = typeof data === 'function' // 判断 data 是不是方法
    ? getData(data, vm) // 如果是方法，getData 拿到数据
    : data || {}
  // 同时定义了_data属性; _data与data引用的都是同一个数据选项
  /*
  * 以下举例: 
  * data: {
  *   a: 1,
  *   b: [1, 2, 3]
  * }
  */
  

  if (!isPlainObject(data)) {
    data = {}
    process.env.NODE_ENV !== 'production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    )
  }
  // proxy data on instance
  // 取出数据key
  const keys = Object.keys(data)
  // Vue的props
  const props = vm.$options.props
  // Vue方法
  const methods = vm.$options.methods
  let i = keys.length
  // 循环，目的是在实例对象上进行数据代理
  while (i--) {
    // 此处循环校验  data 中的 key  不能和  methods 以及 和  props属性中  的 key 一样，否则警告
    const key = keys[i]
    // 预防性提醒
    if (process.env.NODE_ENV !== 'production') {
      if (methods && hasOwn(methods, key)) {
        warn(
          `Method "${key}" has already been defined as a data property.`,
          vm
        )
      }
    }
    if (props && hasOwn(props, key)) {
      process.env.NODE_ENV !== 'production' && warn(
        `The data property "${key}" is already declared as a prop. ` +
        `Use prop default value instead.`,
        vm
      )
    } else if (!isReserved(key)) {
      // isReserved 方法: 检查data的key是否以$或者_开头
      // proxy传入了vm(this), _data, key值；方法在上面, # 从而挂载再_data上
      proxy(vm, `_data`, key)   // 添加到  vm 中
    }
  }
  // observe data

  // 以上while使用proxy() --- Object.defineProperty 做完数据代理，就进入响应系统
  // observe、watch、dep均在 /Observe文件中
  // 传入两个属性: Vue的data, bool值true
  observe(data, true /* asRootData */) // 把数据添加到观察者中
}

export function getData (data: Function, vm: Component): any {
  // #7573 disable dep collection when invoking data getters
  pushTarget()
  try {
    return data.call(vm, vm)
  } catch (e) {
    handleError(e, vm, `data()`)
    return {}
  } finally {
    popTarget()
  }
}

const computedWatcherOptions = { lazy: true }

function initComputed (vm: Component, computed: Object) {
  // $flow-disable-line

  //  创建  _computedWatchers 监听者对象
  const watchers = vm._computedWatchers = Object.create(null)
  // computed properties are just getters during SSR
  const isSSR = isServerRendering()

  // 循环  computed 属性，判断属性key 是否在  this(vm) 中
  for (const key in computed) {
    const userDef = computed[key]
    const getter = typeof userDef === 'function' ? userDef : userDef.get
    if (process.env.NODE_ENV !== 'production' && getter == null) {
      warn(
        `Getter is missing for computed property "${key}".`,
        vm
      )
    }

    if (!isSSR) { // 不是服务器，数据加入 Watcher  中
      // create internal watcher for the computed property.
      watchers[key] = new Watcher(
        vm,
        getter || noop,
        noop,
        computedWatcherOptions
      )
    }

    // component-defined computed properties are already defined on the
    // component prototype. We only need to define computed properties defined
    // at instantiation here.
    if (!(key in vm)) {
      // 是否为浏览器，让浏览器去调用  收集观察者
      defineComputed(vm, key, userDef) 
    } else if (process.env.NODE_ENV !== 'production') {
      if (key in vm.$data) {
        warn(`The computed property "${key}" is already defined in data.`, vm)
      } else if (vm.$options.props && key in vm.$options.props) {
        warn(`The computed property "${key}" is already defined as a prop.`, vm)
      }
    }
  }
}

// createComputedGetter  为  _computedWatchers  收集观察者，为watcher 添加  dep
export function defineComputed (
  target: any,
  key: string,
  userDef: Object | Function
) {
  const shouldCache = !isServerRendering()
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = shouldCache
      ? createComputedGetter(key)
      : createGetterInvoker(userDef)
    sharedPropertyDefinition.set = noop
  } else {
    sharedPropertyDefinition.get = userDef.get
      ? shouldCache && userDef.cache !== false
        ? createComputedGetter(key)
        : createGetterInvoker(userDef.get)
      : noop
    sharedPropertyDefinition.set = userDef.set || noop
  }
  if (process.env.NODE_ENV !== 'production' &&
      sharedPropertyDefinition.set === noop) {
    sharedPropertyDefinition.set = function () {
      warn(
        `Computed property "${key}" was assigned to but it has no setter.`,
        this
      )
    }
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}

function createComputedGetter (key) {
  return function computedGetter () {
    const watcher = this._computedWatchers && this._computedWatchers[key]
    if (watcher) {
      if (watcher.dirty) {
        watcher.evaluate()
      }
      if (Dep.target) {
        watcher.depend()
      }
      return watcher.value
    }
  }
}

function createGetterInvoker(fn) {
  return function computedGetter () {
    return fn.call(this, this)
  }
}

function initMethods (vm: Component, methods: Object) {
  const props = vm.$options.props
  // 校验事件中的  key  有没有 和 props 属性一样的，如果有一样的或者以 $ _  开头
  // 则警告
  for (const key in methods) {
    if (process.env.NODE_ENV !== 'production') {
      if (typeof methods[key] !== 'function') {
        warn(
          `Method "${key}" has type "${typeof methods[key]}" in the component definition. ` +
          `Did you reference the function correctly?`,
          vm
        )
      }
      if (props && hasOwn(props, key)) {
        warn(
          `Method "${key}" has already been defined as a prop.`,
          vm
        )
      }
      if ((key in vm) && isReserved(key)) {
        warn(
          `Method "${key}" conflicts with an existing Vue instance method. ` +
          `Avoid defining component methods that start with _ or $.`
        )
      }
    }
    // 如果没问题，再把 key 放入  vm 中，使用 this 去调用,
    vm[key] = typeof methods[key] !== 'function' ? noop : bind(methods[key], vm) // 绑定 this
  }
}


// 遍历options中的watch 调用 createWatcher
function initWatch (vm: Component, watch: Object) {
  for (const key in watch) {
    const handler = watch[key]
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i])
      }
    } else {
      createWatcher(vm, key, handler)
    }
  }
}

// 转义 handler ， 并且为Watch数据建立观察者
function createWatcher (
  vm: Component,
  expOrFn: string | Function,
  handler: any,
  options?: Object
) {
  if (isPlainObject(handler)) {
    options = handler
    handler = handler.handler
  }
  if (typeof handler === 'string') {
    handler = vm[handler]
  }
  //  调用  $watch, Vue.prototype.$watch  在下面
  return vm.$watch(expOrFn, handler, options)
}

// 为 原型添加 set、$delete、$watch
export function stateMixin (Vue: Class<Component>) {
  // flow somehow has problems with directly declared definition object
  // when using Object.defineProperty, so we have to procedurally build up
  // the object here.
  const dataDef = {}
  dataDef.get = function () { return this._data }
  const propsDef = {}
  propsDef.get = function () { return this._props }
  if (process.env.NODE_ENV !== 'production') {
    dataDef.set = function () {
      warn(
        'Avoid replacing instance root $data. ' +
        'Use nested data properties instead.',
        this
      )
    }
    propsDef.set = function () {
      warn(`$props is readonly.`, this)
    }
  }
  Object.defineProperty(Vue.prototype, '$data', dataDef)
  Object.defineProperty(Vue.prototype, '$props', propsDef)

  Vue.prototype.$set = set
  Vue.prototype.$delete = del

  Vue.prototype.$watch = function (
    expOrFn: string | Function,
    cb: any,
    options?: Object
  ): Function {
    const vm: Component = this
    if (isPlainObject(cb)) {
      return createWatcher(vm, expOrFn, cb, options)
    }
    options = options || {}
    options.user = true
    // 实例化 Watcher 观察者 , 判断是否为对象
    const watcher = new Watcher(vm, expOrFn, cb, options)
    // 是对象的话，深层递归调用 createWatcher
    if (options.immediate) {
      try {
        cb.call(vm, watcher.value)
      } catch (error) {
        handleError(error, vm, `callback for immediate watcher "${watcher.expression}"`)
      }
    }
    return function unwatchFn () {
      watcher.teardown()
    }
  }
}
