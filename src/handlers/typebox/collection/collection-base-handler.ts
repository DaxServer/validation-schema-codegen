import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { getTypeBoxType } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { Node, ts } from 'ts-morph'

export abstract class CollectionBaseHandler extends BaseTypeHandler {
  protected processTypeCollection(nodes: Node[], typeBoxFunction: string): ts.Expression {
    const typeBoxTypes = nodes.map((node) => getTypeBoxType(node))
    const arrayLiteral = ts.factory.createArrayLiteralExpression(typeBoxTypes)

    return makeTypeCall(typeBoxFunction, [arrayLiteral])
  }
}
