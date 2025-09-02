import { GenericTypeUtils } from '@daxserver/validation-schema-codegen/utils/generic-type-utils'
import { ts } from 'ts-morph'

/**
 * Helper class to process different types within template literals
 */
export class TemplateLiteralTypeProcessor {
  /**
   * Process a TypeScript type node and convert it to a TypeBox expression
   */
  static processType(node: ts.TypeNode): ts.Expression {
    switch (node.kind) {
      case ts.SyntaxKind.StringKeyword:
        return GenericTypeUtils.makeTypeCall('String')
      case ts.SyntaxKind.NumberKeyword:
        return GenericTypeUtils.makeTypeCall('Number')
      case ts.SyntaxKind.LiteralType:
        return this.processLiteralType(node as ts.LiteralTypeNode)
      case ts.SyntaxKind.UnionType:
        return this.processUnionType(node as ts.UnionTypeNode)
      default:
        return GenericTypeUtils.makeTypeCall('String')
    }
  }

  /**
   * Process literal type nodes (string, number, boolean literals)
   */
  private static processLiteralType(literalType: ts.LiteralTypeNode): ts.Expression {
    if (ts.isStringLiteral(literalType.literal)) {
      return GenericTypeUtils.makeTypeCall('Literal', [
        ts.factory.createStringLiteral(literalType.literal.text),
      ])
    }

    if (ts.isNumericLiteral(literalType.literal)) {
      return GenericTypeUtils.makeTypeCall('Literal', [
        ts.factory.createNumericLiteral(literalType.literal.text),
      ])
    }

    // Fallback for other literals (boolean, etc.)
    return GenericTypeUtils.makeTypeCall('String')
  }

  /**
   * Process union type nodes
   */
  private static processUnionType(unionType: ts.UnionTypeNode): ts.Expression {
    const unionParts = unionType.types.map((t) => {
      if (t.kind === ts.SyntaxKind.LiteralType) {
        const literalType = t as ts.LiteralTypeNode
        if (ts.isStringLiteral(literalType.literal)) {
          return GenericTypeUtils.makeTypeCall('Literal', [
            ts.factory.createStringLiteral(literalType.literal.text),
          ])
        }
      }
      return GenericTypeUtils.makeTypeCall('String') // fallback
    })

    return GenericTypeUtils.makeTypeCall('Union', [
      ts.factory.createArrayLiteralExpression(unionParts),
    ])
  }
}
