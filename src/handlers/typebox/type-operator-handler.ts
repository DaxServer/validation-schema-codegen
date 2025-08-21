import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { Node, SyntaxKind, ts } from 'ts-morph'

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
