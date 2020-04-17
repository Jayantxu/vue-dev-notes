/* @flow */

import * as nodeOps from 'weex/runtime/node-ops'
import { createPatchFunction } from 'core/vdom/patch'
import baseModules from 'core/vdom/modules/index'
import platformModules from 'weex/runtime/modules/index'

// the directive module should be applied last, after all
// built-in modules have been applied.
const modules = platformModules.concat(baseModules)


// createPatchFunction 传 nodeOps 和 modules 对象进去
// nodeOps 对象，   ->  runtime/node-ops
// modules 对象  ->  baseModules + platformModules 组成 -> /vdom/modules/index

export const patch: Function = createPatchFunction({
  nodeOps,
  modules,
  LONG_LIST_THRESHOLD: 10
})
