import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { GenericTypeUtils } from '@daxserver/validation-schema-codegen/utils/generic-type-utils'
import { Node, ts, TypeReferenceNode } from 'ts-morph'

export class DateTypeHandler extends BaseTypeHandler {
  canHandle(node: TypeReferenceNode): boolean {
    const typeName = node.getTypeName()

    return Node.isIdentifier(typeName) && typeName.getText() === 'Date'
  }

  handle(): ts.Expression {
    return GenericTypeUtils.makeTypeCall('Date')
  }
}
