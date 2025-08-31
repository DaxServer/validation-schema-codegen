import { TypeReferenceBaseHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/reference/type-reference-base-handler'
import {
  createTypeBoxKeys,
  extractStringKeys,
} from '@daxserver/validation-schema-codegen/utils/key-extraction-utils'
import { getTypeBoxType } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { Node, ts } from 'ts-morph'

export class OmitTypeHandler extends TypeReferenceBaseHandler {
  protected supportedTypeNames = ['Omit']
  protected expectedArgumentCount = 2

  handle(node: Node): ts.Expression {
    const typeRef = this.validateTypeReference(node)
    const [objectType, keysType] = this.extractTypeArguments(typeRef)

    if (!keysType) return makeTypeCall('Any')

    const typeboxObjectType = getTypeBoxType(objectType)
    const omitKeys = extractStringKeys(keysType)
    const typeboxKeys = createTypeBoxKeys(omitKeys)

    return makeTypeCall('Omit', [typeboxObjectType, typeboxKeys])
  }
}
