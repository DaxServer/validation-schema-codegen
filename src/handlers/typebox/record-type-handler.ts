import { Node, ts } from 'ts-morph'
import { makeTypeCall } from '../../utils/typebox-codegen-utils'
import { BaseTypeHandler } from './base-type-handler'

export class RecordTypeHandler extends BaseTypeHandler {
  constructor(getTypeBoxType: (typeNode?: Node) => ts.Expression) {
    super(getTypeBoxType)
  }

  canHandle(typeNode?: Node): boolean {
    if (!Node.isTypeReference(typeNode)) {
      return false
    }
    const referencedType = typeNode.getTypeName()
    return Node.isIdentifier(referencedType) && referencedType.getText() === 'Record'
  }

  handle(typeNode: Node): ts.Expression {
    if (!Node.isTypeReference(typeNode) || typeNode.getTypeArguments().length !== 2) {
      return makeTypeCall('Any')
    }
    const [keyType, valueType] = typeNode.getTypeArguments()
    const typeboxKeyType = this.getTypeBoxType(keyType)
    const typeboxValueType = this.getTypeBoxType(valueType)
    return makeTypeCall('Record', [typeboxKeyType, typeboxValueType])
  }
}
