import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { Node, ts } from 'ts-morph'

export class ArrayTypeHandler extends BaseTypeHandler {
  constructor(getTypeBoxType: (typeNode?: Node) => ts.Expression) {
    super(getTypeBoxType)
  }

  canHandle(typeNode?: Node): boolean {
    return Node.isArrayTypeNode(typeNode)
  }

  handle(typeNode: Node): ts.Expression {
    if (!Node.isArrayTypeNode(typeNode)) {
      return makeTypeCall('Any')
    }
    const elementType = typeNode.getElementTypeNode()
    const elementTypeBox: ts.Expression = this.getTypeBoxType(elementType)
    return makeTypeCall('Array', [elementTypeBox])
  }
}
