import type { NodeGraph } from '@daxserver/validation-schema-codegen/traverse/node-graph'
import type { Node } from 'ts-morph'

export interface TypeReferenceExtractor {
  extractTypeReferences(typeNode: Node, nodeGraph: NodeGraph): string[]
}

export type SupportedNodeType = 'interface' | 'typeAlias' | 'enum' | 'function'

export interface TraversedNode {
  node: Node
  type: SupportedNodeType
  originalName: string
  qualifiedName: string
  isImported?: boolean
  isDirectImport?: boolean
  isRootImport?: boolean
  isMainCode?: boolean
}
