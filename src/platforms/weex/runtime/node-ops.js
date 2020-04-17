/* @flow */
declare var document: WeexDocument;

import TextNode from 'weex/runtime/text-node'

export const namespaceMap = {}

// 创建一个真实DOM
export function createElement (tagName: string): WeexElement {
  return document.createElement(tagName)
}

// 创建一个真实DOM , svg 等形式
export function createElementNS (namespace: string, tagName: string): WeexElement {
  return document.createElement(namespace + ':' + tagName)
}

// 创建一个 文本节点
export function createTextNode (text: string) {
  return new TextNode(text)
}

// 创建一个注释节点
export function createComment (text: string) {
  return document.createComment(text)
}

// 插入节点 在 dom 前
export function insertBefore (
  node: WeexElement,
  target: WeexElement,
  before: WeexElement
) {
  if (target.nodeType === 3) {
    if (node.type === 'text') {
      node.setAttr('value', target.text)
      target.parentNode = node
    } else {
      const text = createElement('text')
      text.setAttr('value', target.text)
      node.insertBefore(text, before)
    }
    return
  }
  node.insertBefore(target, before)
}

//  删除子节点，
export function removeChild (node: WeexElement, child: WeexElement) {
  if (child.nodeType === 3) {
    node.setAttr('value', '')
    return
  }
  node.removeChild(child)
}

// 尾部添加子节点
export function appendChild (node: WeexElement, child: WeexElement) {
  if (child.nodeType === 3) {
    if (node.type === 'text') {
      node.setAttr('value', child.text)
      child.parentNode = node
    } else {
      const text = createElement('text')
      text.setAttr('value', child.text)
      node.appendChild(text)
    }
    return
  }

  node.appendChild(child)
}

// 获取父亲节点DOM
export function parentNode (node: WeexElement): WeexElement | void {
  return node.parentNode
}

// 获取下一个兄弟节点
export function nextSibling (node: WeexElement): WeexElement | void {
  return node.nextSibling
}

// 获取DOM 标签名称
export function tagName (node: WeexElement): string {
  return node.type
}

// 设置DOM文本
export function setTextContent (node: WeexElement, text: string) {
  if (node.parentNode) {
    node.parentNode.setAttr('value', text)
  }
}

// 设置 节点属性 attr
export function setAttribute (node: WeexElement, key: string, val: any) {
  node.setAttr(key, val)
}
// 设置组件样式作用域
export function setStyleScope (node: WeexElement, scopeId: string) {
  node.setAttr('@styleScope', scopeId)
}
