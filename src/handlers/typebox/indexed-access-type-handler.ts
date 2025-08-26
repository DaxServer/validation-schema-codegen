import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { getTypeBoxType } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { IndexedAccessTypeNode, Node, ts } from 'ts-morph'

export class IndexedAccessTypeHandler extends BaseTypeHandler {
  canHandle(node: Node): boolean {
    return node.isKind(ts.SyntaxKind.IndexedAccessType)
  }

  handle(node: IndexedAccessTypeNode): ts.Expression {
    const objectType = node.getObjectTypeNode()
    const indexType = node.getIndexTypeNode()

    // Handle special case: typeof A[number] where A is a readonly tuple
    if (
      objectType?.isKind(ts.SyntaxKind.TypeQuery) &&
      indexType?.isKind(ts.SyntaxKind.NumberKeyword)
    ) {
      return this.handleTypeofArrayAccess(objectType, node)
    }

    const typeboxObjectType = getTypeBoxType(objectType)
    const typeboxIndexType = getTypeBoxType(indexType)

    return makeTypeCall('Index', [typeboxObjectType, typeboxIndexType])
  }

  private handleTypeofArrayAccess(
    typeQuery: Node,
    indexedAccessType: IndexedAccessTypeNode,
  ): ts.Expression {
    const typeQueryNode = typeQuery.asKindOrThrow(ts.SyntaxKind.TypeQuery)
    const exprName = typeQueryNode.getExprName()

    // Get the referenced type name (e.g., "A" from "typeof A")
    if (Node.isIdentifier(exprName)) {
      const typeName = exprName.getText()
      const sourceFile = indexedAccessType.getSourceFile()

      // First try to find a type alias declaration
      const typeAlias = sourceFile.getTypeAlias(typeName)
      if (typeAlias) {
        const tupleUnion = this.extractTupleUnion(typeAlias.getTypeNode())
        if (tupleUnion) {
          return tupleUnion
        }
      }

      // Then try to find a variable declaration
      const variableDeclaration = sourceFile.getVariableDeclaration(typeName)
      if (variableDeclaration) {
        const tupleUnion = this.extractTupleUnion(variableDeclaration.getTypeNode())
        if (tupleUnion) {
          return tupleUnion
        }
      }
    }

    // Fallback to default Index behavior
    const typeboxObjectType = getTypeBoxType(typeQuery)
    const typeboxIndexType = getTypeBoxType(indexedAccessType.getIndexTypeNode())
    return makeTypeCall('Index', [typeboxObjectType, typeboxIndexType])
  }

  private extractTupleUnion(typeNode: Node | undefined): ts.Expression | null {
    if (!typeNode) return null

    let actualTupleType: Node | undefined = typeNode

    // Handle readonly modifier (TypeOperator)
    if (typeNode.isKind(ts.SyntaxKind.TypeOperator)) {
      const typeOperator = typeNode.asKindOrThrow(ts.SyntaxKind.TypeOperator)
      actualTupleType = typeOperator.getTypeNode()
    }

    // Check if it's a tuple type
    if (actualTupleType?.isKind(ts.SyntaxKind.TupleType)) {
      const tupleType = actualTupleType.asKindOrThrow(ts.SyntaxKind.TupleType)
      const elements = tupleType.getElements()

      // Extract literal types from tuple elements
      const literalTypes: ts.Expression[] = []
      for (const element of elements) {
        if (element.isKind(ts.SyntaxKind.LiteralType)) {
          const literalTypeNode = element.asKindOrThrow(ts.SyntaxKind.LiteralType)
          const literal = literalTypeNode.getLiteral()

          if (literal.isKind(ts.SyntaxKind.StringLiteral)) {
            const stringLiteral = literal.asKindOrThrow(ts.SyntaxKind.StringLiteral)
            const value = stringLiteral.getLiteralValue()
            literalTypes.push(makeTypeCall('Literal', [ts.factory.createStringLiteral(value)]))
          }
        }
      }

      // Return union of literal types if we found any
      if (literalTypes.length > 0) {
        return makeTypeCall('Union', [ts.factory.createArrayLiteralExpression(literalTypes)])
      }
    }

    return null
  }
}
