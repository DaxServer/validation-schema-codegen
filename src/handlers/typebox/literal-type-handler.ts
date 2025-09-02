import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { GenericTypeUtils } from '@daxserver/validation-schema-codegen/utils/generic-type-utils'
import { LiteralTypeNode, Node, SyntaxKind, ts } from 'ts-morph'

export class LiteralTypeHandler extends BaseTypeHandler {
  canHandle(node: Node): boolean {
    return Node.isLiteralTypeNode(node) || Node.isTrueLiteral(node) || Node.isFalseLiteral(node)
  }

  handle(node: LiteralTypeNode): ts.Expression {
    const literal = node.getLiteral()

    switch (literal.getKind()) {
      case SyntaxKind.StringLiteral:
        return GenericTypeUtils.makeTypeCall('Literal', [
          ts.factory.createStringLiteral(literal.getText().slice(1, -1)),
        ])
      case SyntaxKind.NumericLiteral:
        return GenericTypeUtils.makeTypeCall('Literal', [
          ts.factory.createNumericLiteral(literal.getText()),
        ])
      case SyntaxKind.TrueKeyword:
        return GenericTypeUtils.makeTypeCall('Literal', [ts.factory.createTrue()])
      case SyntaxKind.FalseKeyword:
        return GenericTypeUtils.makeTypeCall('Literal', [ts.factory.createFalse()])
      case SyntaxKind.NullKeyword:
        return GenericTypeUtils.makeTypeCall('Null')
      default:
        return GenericTypeUtils.makeTypeCall('Any')
    }
  }
}
