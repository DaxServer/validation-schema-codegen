import { Node, ts } from 'ts-morph'
import { makeTypeCall } from '../../utils/typebox-codegen-utils'
import { BaseTypeHandler } from './base-type-handler'

export class UnionTypeHandler extends BaseTypeHandler {
  handledType = ts.SyntaxKind.UnionType
  constructor(getTypeBoxType: (typeNode?: Node) => ts.Expression) {
    super(getTypeBoxType)
  }

  canHandle(typeNode?: Node): boolean {
    return Node.isUnionTypeNode(typeNode)
  }

  handle(typeNode: Node): ts.Expression {
    if (!Node.isUnionTypeNode(typeNode)) {
      return makeTypeCall('Any')
    }
    const unionTypes = typeNode.getTypeNodes().map(this.getTypeBoxType)
    return makeTypeCall('Union', [ts.factory.createArrayLiteralExpression(unionTypes)])
  }
}
