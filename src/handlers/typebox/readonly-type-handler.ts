import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { getTypeBoxType } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { Node, SyntaxKind, ts, TypeOperatorTypeNode } from 'ts-morph'

export class ReadonlyTypeHandler extends BaseTypeHandler {
  canHandle(node: Node): boolean {
    return Node.isTypeOperatorTypeNode(node) && node.getOperator() === SyntaxKind.ReadonlyKeyword
  }

  handle(node: TypeOperatorTypeNode): ts.Expression {
    const operandType = node.getTypeNode()
    const typeboxOperand = getTypeBoxType(operandType)

    // TypeBox uses Readonly utility type for readonly modifiers
    return makeTypeCall('Readonly', [typeboxOperand])
  }
}
