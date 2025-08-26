import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { getTypeBoxType } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { Node, ts, TypeReferenceNode } from 'ts-morph'

export class TypeReferenceHandler extends BaseTypeHandler {
  canHandle(node: Node): boolean {
    return Node.isTypeReference(node)
  }

  handle(node: TypeReferenceNode): ts.Expression {
    const referencedType = node.getTypeName()
    const typeArguments = node.getTypeArguments()

    if (Node.isIdentifier(referencedType)) {
      const typeName = referencedType.getText()

      // If there are type arguments, create a function call
      if (typeArguments.length > 0) {
        const typeBoxArgs = typeArguments.map((arg) => getTypeBoxType(arg))

        return ts.factory.createCallExpression(
          ts.factory.createIdentifier(typeName),
          undefined,
          typeBoxArgs,
        )
      }

      // No type arguments, just return the identifier
      return ts.factory.createIdentifier(typeName)
    }

    return makeTypeCall('Any')
  }
}
