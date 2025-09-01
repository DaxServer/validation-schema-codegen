import type { Node } from 'ts-morph'

export interface TraversedNode {
  node: Node
  type: 'interface' | 'typeAlias' | 'enum' | 'function'
  originalName: string
  qualifiedName: string
  isImported: boolean
  isMainCode: boolean
  aliasName?: string // The alias name used in import statements (e.g., 'UserType' for 'import { User as UserType }')
}
