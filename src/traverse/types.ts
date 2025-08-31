import type { Node } from 'ts-morph'

export interface TraversedNode {
  node: Node
  type: 'interface' | 'typeAlias' | 'enum' | 'function'
  originalName: string
  qualifiedName: string
  isImported: boolean
  isMainCode: boolean
}
