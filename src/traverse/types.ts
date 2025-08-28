import type { Node } from 'ts-morph'

export type SupportedNodeType = 'interface' | 'typeAlias' | 'enum' | 'function'

export interface TraversedNode {
  node: Node
  type: SupportedNodeType
  originalName: string
  qualifiedName: string
  isImported: boolean
  isMainCode: boolean
}
