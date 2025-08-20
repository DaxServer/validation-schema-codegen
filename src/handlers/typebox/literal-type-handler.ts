import { Node, ts, SyntaxKind } from 'ts-morph'
import { makeTypeCall } from '../../utils/typebox-codegen-utils'
import { BaseTypeHandler } from './base-type-handler'

export class LiteralTypeHandler extends BaseTypeHandler {
  constructor() {
    super(() => ts.factory.createIdentifier('')) // getTypeBoxType is not used in LiteralTypeHandler
  }
  canHandle(typeNode?: Node): boolean {
    return (
      Node.isLiteralTypeNode(typeNode) ||
      Node.isTrueLiteral(typeNode) ||
      Node.isFalseLiteral(typeNode)
    )
  }

  handle(typeNode: Node): ts.Expression {
    if (!Node.isLiteralTypeNode(typeNode)) {
      return makeTypeCall('Any')
    }

    const literal = typeNode.getLiteral()
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
