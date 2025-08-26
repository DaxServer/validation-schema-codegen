import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { isTypeOperatorWithOperator } from '@daxserver/validation-schema-codegen/utils/node-type-utils'
import { getTypeBoxType } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { Node, SyntaxKind, ts, TypeOperatorTypeNode } from 'ts-morph'

/**
 * Base class for TypeOperator handlers (KeyOf, Readonly, etc.)
 * Provides common functionality for handling TypeOperatorTypeNode
 */
export abstract class TypeOperatorBaseHandler extends BaseTypeHandler {
  protected abstract readonly operatorKind: SyntaxKind
  protected abstract readonly typeBoxMethod: string

  canHandle(node: Node): boolean {
    return isTypeOperatorWithOperator(node, this.operatorKind)
  }

  handle(node: TypeOperatorTypeNode): ts.Expression {
    const innerType = node.getTypeNode()
    const typeboxInnerType = getTypeBoxType(innerType)
    return this.createTypeBoxCall(typeboxInnerType)
  }

  protected abstract createTypeBoxCall(innerType: ts.Expression): ts.Expression
}
