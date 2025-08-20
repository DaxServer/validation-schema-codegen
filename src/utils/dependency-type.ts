import { Node, TypeReferenceNode } from 'ts-morph'
import type { TypeDependency } from './dependency-collector'

export interface TypeReferenceExtractor {
  extractTypeReferences(typeNode: Node, dependencies: Map<string, TypeDependency>): string[]
}

export class DefaultTypeReferenceExtractor implements TypeReferenceExtractor {
  private static cache = new Map<string, string[]>()


  extractTypeReferences(typeNode: Node, dependencies: Map<string, TypeDependency>): string[] {
    // Simple cache key using content only
    const cacheKey = typeNode.getText()

    const cached = DefaultTypeReferenceExtractor.cache.get(cacheKey)
    if (cached) return cached

    const references: string[] = []
    const visited = new Set<Node>()

    const traverse = (node: Node): void => {
      if (visited.has(node)) return
      visited.add(node)

      // Handle type references
      if (Node.isTypeReference(node)) {
        const typeRefNode = node as TypeReferenceNode
        const typeName = typeRefNode.getTypeName().getText()

        if (dependencies.has(typeName)) {
          references.push(typeName)
        }
        return // No need to traverse children of type references
      }

      // Use forEachChild for better performance instead of getChildren()
      node.forEachChild(traverse)
    }

    traverse(typeNode)

    // Cache the result
    DefaultTypeReferenceExtractor.cache.set(cacheKey, references)
    return references
  }

  clear(): void {
    DefaultTypeReferenceExtractor.cache.clear()
  }


}
