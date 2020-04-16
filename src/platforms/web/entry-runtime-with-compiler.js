/* @flow */

// mount方法
import config from 'core/config'
import { warn, cached } from 'core/util/index'
import { mark, measure } from 'core/util/perf'

import Vue from './runtime/index'
import { query } from './util/index'
import { compileToFunctions } from './compiler/index'
import { shouldDecodeNewlines, shouldDecodeNewlinesForHref } from './util/compat'

const idToTemplate = cached(id => {
  const el = query(id)
  return el && el.innerHTML
})

/**此处将Vue.prototype.$mount赋予 mount变量 */
const mount = Vue.prototype.$mount
/**然后重写原型上得$mount */
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && query(el) // 

  /* istanbul ignore if */
  // 节点做了限制，不能挂载在body， html上
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }

  const options = this.$options
  // resolve template/el and convert to render function
  // 判断option中是否有render   使用template或render   始终都会经过render
  if (!options.render) {
    let template = options.template // 判断是否有options.template
    if (template) {
      if (typeof template === 'string') {
        if (template.charAt(0) === '#') {// 如果是  id  则获取dom 中 html
          template = idToTemplate(template)
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            )
          }
        }
      } else if (template.nodeType) {
        template = template.innerHTML
      } else {
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this)
        }
        return this
      }
    } else if (el) {
      // 如果没有template，则从  el  中找 innerHTML
      template = getOuterHTML(el)
    }
    if (template) {
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile')
      }
      // 获取到  template 之后，它是调用 compileToFunctions 方法实现的
      const { render, staticRenderFns } = compileToFunctions(template, {
        // 执行  compileToFunctions  创建一个缓存模板字符串函数，
        outputSourceRange: process.env.NODE_ENV !== 'production',
        shouldDecodeNewlines, // false 
        shouldDecodeNewlinesForHref,
        delimiters: options.delimiters, // 改变纯文本插入分割符
        comments: options.comments
      }, this)
      options.render = render
      options.staticRenderFns = staticRenderFns

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile end')
        measure(`vue ${this._name} compile`, 'compile', 'compile end')
      }
    }
  }
  // 处理完挂载上去 /**最终还是调用了mount  在 platforms/web/runtime/index.js中 */
  return mount.call(this, el, hydrating)  // 调用  Vue.prototype.$mount
}

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */
function getOuterHTML (el: Element): string {
  if (el.outerHTML) {
    return el.outerHTML
  } else {
    const container = document.createElement('div')
    container.appendChild(el.cloneNode(true))
    return container.innerHTML
  }
}

Vue.compile = compileToFunctions

export default Vue
