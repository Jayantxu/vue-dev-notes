/* @flow */

import { baseOptions } from './options'
import { createCompiler } from 'compiler/index'

// 将baseOptions参数传入，缓存起来
const { compile, compileToFunctions } = createCompiler(baseOptions)

export { compile, compileToFunctions }
