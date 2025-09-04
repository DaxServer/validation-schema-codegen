import { TypeReferenceBaseHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/reference/type-reference-base-handler'
import { GenericTypeUtils } from '@daxserver/validation-schema-codegen/utils/generic-type-utils'
import {
  getTypeBoxType,
  type TypeBoxContext,
} from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { ts, TypeReferenceNode } from 'ts-morph'

export class PartialTypeHandler extends TypeReferenceBaseHandler {
  protected readonly supportedTypeNames = ['Partial']
  protected readonly expectedArgumentCount = 1

  handle(node: TypeReferenceNode, context: TypeBoxContext): ts.Expression {
    const typeRef = this.validateTypeReference(node)
    const [innerType] = this.extractTypeArguments(typeRef)

    const typeBoxType = getTypeBoxType(innerType, context)

    return GenericTypeUtils.makeTypeCall('Partial', [typeBoxType])
  }
}
