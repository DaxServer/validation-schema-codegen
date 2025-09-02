import type { Node } from 'ts-morph'

export interface TraversedNode {
  node: Node
  type: 'interface' | 'typeAlias' | 'enum' | 'function' | 'chunk'
  originalName: string
  qualifiedName: string
  isImported: boolean
  isMainCode: boolean
  aliasName?: string // The alias name used in import statements (e.g., 'UserType' for 'import { User as UserType }')
  // Chunk-specific properties
  isChunk?: boolean
  chunkReferences?: string[]
}
