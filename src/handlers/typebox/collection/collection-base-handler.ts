import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { GenericTypeUtils } from '@daxserver/validation-schema-codegen/utils/generic-type-utils'
import type { TypeBoxContext } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { getTypeBoxType } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { Node, ts } from 'ts-morph'

export abstract class CollectionBaseHandler extends BaseTypeHandler {
  protected processTypeCollection(
    nodes: Node[],
    typeBoxFunction: string,
    context: TypeBoxContext,
  ): ts.Expression {
    const typeBoxTypes = nodes.map((node) => getTypeBoxType(node, context))
    const arrayLiteral = ts.factory.createArrayLiteralExpression(typeBoxTypes)

    return GenericTypeUtils.makeTypeCall(typeBoxFunction, [arrayLiteral])
  }
}
