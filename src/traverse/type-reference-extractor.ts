import { NodeGraph } from '@daxserver/validation-schema-codegen/traverse/node-graph'
import { Node, SyntaxKind } from 'ts-morph'

export class TypeReferenceExtractor {
  constructor(private nodeGraph: NodeGraph) {}

  extractTypeReferences(node: Node): string[] {
    const references: string[] = []
    const visited = new Set<Node>()

    const traverse = (node: Node): void => {
      if (visited.has(node)) return
      visited.add(node)

      if (Node.isTypeReference(node)) {
        const typeName = node.getTypeName().getText()

        for (const qualifiedName of this.nodeGraph.nodes()) {
          const nodeData = this.nodeGraph.getNode(qualifiedName)
          if (nodeData.originalName === typeName) {
            references.push(qualifiedName)
            break
          }
        }
      }

      // Handle typeof expressions (TypeQuery nodes)
      if (Node.isTypeQuery(node)) {
        const exprName = node.getExprName()

        if (Node.isIdentifier(exprName) || Node.isQualifiedName(exprName)) {
          const typeName = exprName.getText()

          for (const qualifiedName of this.nodeGraph.nodes()) {
            const nodeData = this.nodeGraph.getNode(qualifiedName)
            if (nodeData.originalName === typeName) {
              references.push(qualifiedName)
              break
            }
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
              const baseTypeName = typeNode.getTypeName().getText()

              for (const qualifiedName of this.nodeGraph.nodes()) {
                const nodeData = this.nodeGraph.getNode(qualifiedName)
                if (nodeData.originalName === baseTypeName) {
                  references.push(qualifiedName)
                  break
                }
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

                for (const qualifiedName of this.nodeGraph.nodes()) {
                  const nodeData = this.nodeGraph.getNode(qualifiedName)
                  if (nodeData.originalName === baseTypeName) {
                    references.push(qualifiedName)
                    break
                  }
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

          for (const qualifiedName of this.nodeGraph.nodes()) {
            const nodeData = this.nodeGraph.getNode(qualifiedName)
            if (nodeData.originalName === typeName) {
              references.push(qualifiedName)
              break
            }
          }
        }
      }

      node.forEachChild(traverse)
    }

    traverse(node)

    return references
  }
}
