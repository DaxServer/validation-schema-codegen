import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { Node, ts, TypeReferenceNode } from 'ts-morph'

export class TypeReferenceHandler extends BaseTypeHandler {
  canHandle(node: Node): boolean {
    return Node.isTypeReference(node)
  }

  handle(node: TypeReferenceNode): ts.Expression {
    const referencedType = node.getTypeName()

    if (Node.isIdentifier(referencedType)) {
      const typeName = referencedType.getText()
      return ts.factory.createIdentifier(typeName)
    }

    return makeTypeCall('Any')
  }
}
