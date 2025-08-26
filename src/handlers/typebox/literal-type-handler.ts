import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { Node, SyntaxKind, ts } from 'ts-morph'

export class LiteralTypeHandler extends BaseTypeHandler {
  canHandle(node: Node): boolean {
    return Node.isLiteralTypeNode(node) || Node.isTrueLiteral(node) || Node.isFalseLiteral(node)
  }

  handle(node: Node): ts.Expression {
    if (!Node.isLiteralTypeNode(node)) {
      return makeTypeCall('Any')
    }

    const literal = node.getLiteral()
    const literalKind = literal.getKind()

    switch (literalKind) {
      case SyntaxKind.StringLiteral:
        return makeTypeCall('Literal', [
          ts.factory.createStringLiteral(literal.getText().slice(1, -1)),
        ])
      case SyntaxKind.NumericLiteral:
        return makeTypeCall('Literal', [ts.factory.createNumericLiteral(literal.getText())])
      case SyntaxKind.TrueKeyword:
        return makeTypeCall('Literal', [ts.factory.createTrue()])
      case SyntaxKind.FalseKeyword:
        return makeTypeCall('Literal', [ts.factory.createFalse()])
      case SyntaxKind.NullKeyword:
        return makeTypeCall('Null')
      default:
        return makeTypeCall('Any')
    }
  }
}
