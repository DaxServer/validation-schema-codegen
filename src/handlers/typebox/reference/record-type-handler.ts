import { TypeReferenceBaseHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/reference/type-reference-base-handler'
import { getTypeBoxType } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { Node, ts } from 'ts-morph'

export class RecordTypeHandler extends TypeReferenceBaseHandler {
  protected readonly supportedTypeNames = ['Record']
  protected readonly expectedArgumentCount = 2

  handle(node: Node): ts.Expression {
    const typeRef = this.validateTypeReference(node)
    const [keyType, valueType] = this.extractTypeArguments(typeRef)

    const typeBoxKeyType = getTypeBoxType(keyType)
    const typeBoxValueType = getTypeBoxType(valueType)

    return makeTypeCall('Record', [typeBoxKeyType, typeBoxValueType])
  }
}
