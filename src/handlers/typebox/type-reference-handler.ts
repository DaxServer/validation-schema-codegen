import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { Node, ts } from 'ts-morph'

export class TypeReferenceHandler extends BaseTypeHandler {
  constructor(getTypeBoxType: (typeNode?: Node) => ts.Expression) {
    super(getTypeBoxType)
  }

  canHandle(typeNode?: Node): boolean {
    return Node.isTypeReference(typeNode)
  }

  handle(typeNode: Node): ts.Expression {
    if (!Node.isTypeReference(typeNode)) {
      return makeTypeCall('Any')
    }
    const referencedType = typeNode.getTypeName()
    if (Node.isIdentifier(referencedType)) {
      const typeName = referencedType.getText()
      return ts.factory.createIdentifier(typeName)
    }
    return makeTypeCall('Any')
  }
}
