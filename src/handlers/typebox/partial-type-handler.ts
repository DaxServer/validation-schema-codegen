import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { Node, ts } from 'ts-morph'

export class PartialTypeHandler extends BaseTypeHandler {
  constructor(getTypeBoxType: (typeNode?: Node) => ts.Expression) {
    super(getTypeBoxType)
  }

  canHandle(typeNode?: Node): boolean {
    if (!Node.isTypeReference(typeNode)) {
      return false
    }
    const referencedType = typeNode.getTypeName()
    return Node.isIdentifier(referencedType) && referencedType.getText() === 'Partial'
  }

  handle(typeNode: Node): ts.Expression {
    if (!Node.isTypeReference(typeNode) || typeNode.getTypeArguments().length !== 1) {
      return makeTypeCall('Any')
    }
    const [partialType] = typeNode.getTypeArguments()
    const typeboxPartialType = this.getTypeBoxType(partialType)
    return makeTypeCall('Partial', [typeboxPartialType])
  }
}
