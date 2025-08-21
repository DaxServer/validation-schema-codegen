import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { Node, ts } from 'ts-morph'

export class IntersectionTypeHandler extends BaseTypeHandler {
  constructor(getTypeBoxType: (typeNode?: Node) => ts.Expression) {
    super(getTypeBoxType)
  }

  canHandle(typeNode?: Node): boolean {
    return Node.isIntersectionTypeNode(typeNode)
  }

  handle(typeNode: Node): ts.Expression {
    if (!Node.isIntersectionTypeNode(typeNode)) {
      return makeTypeCall('Any')
    }
    const intersectionTypes = typeNode.getTypeNodes().map(this.getTypeBoxType)
    return makeTypeCall('Intersect', [ts.factory.createArrayLiteralExpression(intersectionTypes)])
  }
}
