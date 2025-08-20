import { Node, ts, SyntaxKind } from 'ts-morph'
import { makeTypeCall } from '../../utils/typebox-codegen-utils'
import { BaseTypeHandler } from './base-type-handler'

export class TypeOperatorHandler extends BaseTypeHandler {
  constructor(getTypeBoxType: (typeNode?: Node) => ts.Expression) {
    super(getTypeBoxType)
  }

  canHandle(typeNode?: Node): boolean {
    return Node.isTypeOperatorTypeNode(typeNode)
  }

  handle(typeNode: Node): ts.Expression {
    if (!Node.isTypeOperatorTypeNode(typeNode)) {
      return makeTypeCall('Any')
    }
    if (typeNode.getOperator() === SyntaxKind.KeyOfKeyword) {
      const operandType = typeNode.getTypeNode()
      const typeboxOperand = this.getTypeBoxType(operandType)
      return makeTypeCall('KeyOf', [typeboxOperand])
    }

    return makeTypeCall('Any')
  }
}
