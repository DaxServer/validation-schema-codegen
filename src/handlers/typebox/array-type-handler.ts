import { Node, ts } from 'ts-morph'
import { makeTypeCall } from '../../utils/typebox-codegen-utils'
import { BaseTypeHandler } from './base-type-handler'

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
