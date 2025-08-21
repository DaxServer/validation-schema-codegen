import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { Node, ts } from 'ts-morph'

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
