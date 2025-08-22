import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { Node, ts, TypeOperatorTypeNode } from 'ts-morph'

export class TypeOperatorHandler extends BaseTypeHandler {
  canHandle(node: Node): boolean {
    // This handler now serves as a fallback for unhandled type operators
    // Specific operators like KeyOf and Readonly have their own handlers
    return Node.isTypeOperatorTypeNode(node)
  }

  handle(node: TypeOperatorTypeNode): ts.Expression {
    // Fallback for any unhandled type operators
    throw new Error(`Unhandled type operator: ${node.getOperator()}`)
    // return makeTypeCall('Any')
  }
}
