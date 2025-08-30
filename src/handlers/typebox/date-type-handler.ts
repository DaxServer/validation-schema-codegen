import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { Node, ts, TypeReferenceNode } from 'ts-morph'

export class DateTypeHandler extends BaseTypeHandler {
  canHandle(node: TypeReferenceNode): boolean {
    const typeName = node.getTypeName()

    return Node.isIdentifier(typeName) && typeName.getText() === 'Date'
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handle(_node: TypeReferenceNode): ts.Expression {
    return makeTypeCall('Date')
  }
}
