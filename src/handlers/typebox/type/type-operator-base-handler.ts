import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { GenericTypeUtils } from '@daxserver/validation-schema-codegen/utils/generic-type-utils'
import { isTypeOperatorWithOperator } from '@daxserver/validation-schema-codegen/utils/node-type-utils'
import type { TypeBoxContext } from '@daxserver/validation-schema-codegen/utils/typebox-call'
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

  handle(node: TypeOperatorTypeNode, context: TypeBoxContext): ts.Expression {
    const innerType = node.getTypeNode()
    const typeboxType = getTypeBoxType(innerType, context)

    return GenericTypeUtils.makeTypeCall(this.typeBoxMethod, [typeboxType])
  }
}
