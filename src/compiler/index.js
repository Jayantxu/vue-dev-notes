/* @flow */

import { parse } from './parser/index'
import { optimize } from './optimizer'
import { generate } from './codegen/index'
import { createCompilerCreator } from './create-compiler'

// `createCompilerCreator` allows creating compilers that use alternative
// parser/optimizer/codegen, e.g the SSR optimizing compiler.
// Here we just export a default compiler using the default parts.
// 
export const createCompiler = createCompilerCreator(function baseCompile (
  template: string,
  options: CompilerOptions
): CompiledResult {
  const ast = parse(template.trim(), options) // 将 HTML 转为 AST 模板对象
  if (options.optimize !== false) {
    optimize(ast, options)  // optimize 的主要作用是标记标签是不是静态节点
  }
  const code = generate(ast, options) // 初始化扩展指令   on， bind...
  return {
    ast,
    render: code.render, // 虚拟DOM 选用渲染的参数函数
    staticRenderFns: code.staticRenderFns
  }
})
