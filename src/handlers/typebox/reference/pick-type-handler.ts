import { TypeReferenceBaseHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/reference/type-reference-base-handler'
import { GenericTypeUtils } from '@daxserver/validation-schema-codegen/utils/generic-type-utils'
import {
  createTypeBoxKeys,
  extractStringKeys,
} from '@daxserver/validation-schema-codegen/utils/key-extraction-utils'
import {
  getTypeBoxType,
  type TypeBoxContext,
} from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { ts, TypeReferenceNode } from 'ts-morph'

export class PickTypeHandler extends TypeReferenceBaseHandler {
  protected readonly supportedTypeNames = ['Pick']
  protected readonly expectedArgumentCount = 2

  handle(node: TypeReferenceNode, context: TypeBoxContext): ts.Expression {
    const typeRef = this.validateTypeReference(node)
    const [objectType, keysType] = this.extractTypeArguments(typeRef)

    if (!keysType) return GenericTypeUtils.makeTypeCall('Any')

    const typeboxObjectType = getTypeBoxType(objectType, context)
    const pickKeys = extractStringKeys(keysType)
    const typeboxKeys = createTypeBoxKeys(pickKeys)

    return GenericTypeUtils.makeTypeCall('Pick', [typeboxObjectType, typeboxKeys])
  }
}
