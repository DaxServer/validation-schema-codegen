import { resolverStore } from '@daxserver/validation-schema-codegen/utils/resolver-store'
import { Node, SyntaxKind } from 'ts-morph'

export class TypeReferenceExtractor {
  private resolveCache = new Map<string, string | null>()

  private static readonly BUILT_IN_TYPES = new Set([
    'Partial',
    'Required',
    'Readonly',
    'Record',
    'Pick',
    'Omit',
    'Exclude',
    'Extract',
    'NonNullable',
    'ReturnType',
    'InstanceType',
    'Parameters',
    'ConstructorParameters',
    'ThisParameterType',
    'OmitThisParameter',
    'ThisType',
    'Uppercase',
    'Lowercase',
    'Capitalize',
    'Uncapitalize',
    'NoInfer',
    'Awaited',
  ])

  extractTypeReferences(node: Node): string[] {
    const references: string[] = []
    const visited = new Set<Node>()

    const traverse = (node: Node): void => {
      if (visited.has(node)) return
      visited.add(node)

      if (Node.isTypeReference(node)) {
        const typeNameNode = node.getTypeName()
        const typeName = typeNameNode.getText()

        const qualifiedName = this.resolveTypeNameToQualifiedName(typeName, typeNameNode)
        if (qualifiedName) {
          references.push(qualifiedName)
        }
      }

      // Handle typeof expressions (TypeQuery nodes)
      if (Node.isTypeQuery(node)) {
        const exprName = node.getExprName()

        if (Node.isIdentifier(exprName) || Node.isQualifiedName(exprName)) {
          const typeName = exprName.getText()

          const qualifiedName = this.resolveTypeNameToQualifiedName(typeName, exprName)
          if (qualifiedName) {
            references.push(qualifiedName)
          }
        }
      }

      // Handle interface inheritance (extends clauses)
      if (Node.isInterfaceDeclaration(node)) {
        const heritageClauses = node.getHeritageClauses()

        for (const heritageClause of heritageClauses) {
          if (heritageClause.getToken() !== SyntaxKind.ExtendsKeyword) continue

          for (const typeNode of heritageClause.getTypeNodes()) {
            // Handle both simple types and generic types
            if (Node.isTypeReference(typeNode)) {
              const baseTypeNameNode = typeNode.getTypeName()
              const baseTypeName = baseTypeNameNode.getText()

              const qualifiedName = this.resolveTypeNameToQualifiedName(
                baseTypeName,
                baseTypeNameNode,
              )
              if (qualifiedName) {
                references.push(qualifiedName)
              }

              // Also extract dependencies from type arguments
              const typeArguments = typeNode.getTypeArguments()
              for (const typeArg of typeArguments) {
                const argReferences = this.extractTypeReferences(typeArg)
                references.push(...argReferences)
              }
            } else if (Node.isExpressionWithTypeArguments(typeNode)) {
              // Handle ExpressionWithTypeArguments (e.g., EntityInfo<PropertyId>)
              const expression = typeNode.getExpression()

              if (Node.isIdentifier(expression)) {
                const baseTypeName = expression.getText()

                const qualifiedName = this.resolveTypeNameToQualifiedName(baseTypeName, expression)
                if (qualifiedName) {
                  references.push(qualifiedName)
                }
              }

              // Also extract dependencies from type arguments
              const typeArguments = typeNode.getTypeArguments()
              for (const typeArg of typeArguments) {
                const argReferences = this.extractTypeReferences(typeArg)
                references.push(...argReferences)
              }
            }
          }
        }
      }

      // Handle call expressions (for generic type calls like EntityInfo(PropertyId))
      if (Node.isCallExpression(node)) {
        const expression = node.getExpression()
        if (Node.isIdentifier(expression)) {
          const typeName = expression.getText()

          const qualifiedName = this.resolveTypeNameToQualifiedName(typeName, expression)
          if (qualifiedName) {
            references.push(qualifiedName)
          }
        }
      }

      node.forEachChild(traverse)
    }

    traverse(node)

    return references
  }

  /**
   * Resolves a type name to its qualified name using the ResolverStore
   */
  private resolveTypeNameToQualifiedName(typeName: string, node: Node): string | null {
    if (TypeReferenceExtractor.BUILT_IN_TYPES.has(typeName)) {
      return null
    }

    // Check cache for non-built-in types
    const cacheKey = `${typeName}:${node.getKind()}:${node.getStart()}`
    if (this.resolveCache.has(cacheKey)) {
      return this.resolveCache.get(cacheKey)!
    }

    // Resolve using ResolverStore
    const qualifiedName = resolverStore.resolveQualifiedName(typeName)
    this.resolveCache.set(cacheKey, qualifiedName)

    return qualifiedName
  }
}
