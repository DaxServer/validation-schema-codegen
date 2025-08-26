import { InterfaceDeclaration, Node, TypeAliasDeclaration, TypeReferenceNode } from 'ts-morph'

/**
 * AST traversal patterns used in dependency analysis
 */
export class ASTTraversal {
  private static cache = new Map<string, string[]>()

  /**
   * Extract interface names referenced by a type alias
   */
  static extractInterfaceReferences(
    typeAlias: TypeAliasDeclaration,
    interfaces: Map<string, InterfaceDeclaration>,
  ): string[] {
    const typeNode = typeAlias.getTypeNode()
    if (!typeNode) return []

    const cacheKey = `interface_refs_${typeNode.getText()}`
    const cached = ASTTraversal.cache.get(cacheKey)
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

        if (interfaces.has(typeName)) {
          references.push(typeName)
        }
        // Continue traversing to handle type arguments in generic instantiations
      }

      // Use forEachChild for better performance
      node.forEachChild(traverse)
    }

    traverse(typeNode)

    // Cache the result
    ASTTraversal.cache.set(cacheKey, references)
    return references
  }

  /**
   * Extract type alias names referenced by an interface (e.g., in type parameter constraints)
   */
  static extractTypeAliasReferences(
    interfaceDecl: InterfaceDeclaration,
    typeAliases: Map<string, TypeAliasDeclaration>,
  ): string[] {
    const cacheKey = `type_alias_refs_${interfaceDecl.getName()}_${interfaceDecl.getText()}`
    const cached = ASTTraversal.cache.get(cacheKey)
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

        if (typeAliases.has(typeName)) {
          references.push(typeName)
        }
        return // No need to traverse children of type references
      }

      // Use forEachChild for better performance
      node.forEachChild(traverse)
    }

    // Check type parameters for constraints
    for (const typeParam of interfaceDecl.getTypeParameters()) {
      const constraint = typeParam.getConstraint()
      if (constraint) {
        traverse(constraint)
      }
    }

    // Check heritage clauses
    for (const heritageClause of interfaceDecl.getHeritageClauses()) {
      for (const typeNode of heritageClause.getTypeNodes()) {
        traverse(typeNode)
      }
    }

    // Cache the result
    ASTTraversal.cache.set(cacheKey, references)
    return references
  }

  /**
   * Clear the internal cache
   */
  static clearCache(): void {
    ASTTraversal.cache.clear()
  }
}
