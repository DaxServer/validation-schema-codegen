import { TypeReferenceBaseHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/reference/type-reference-base-handler'
import { GenericTypeUtils } from '@daxserver/validation-schema-codegen/utils/generic-type-utils'
import type { TypeBoxContext } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { getTypeBoxType } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { ts, TypeReferenceNode } from 'ts-morph'

export class RequiredTypeHandler extends TypeReferenceBaseHandler {
  protected readonly supportedTypeNames = ['Required']
  protected readonly expectedArgumentCount = 1

  handle(node: TypeReferenceNode, context: TypeBoxContext): ts.Expression {
    const typeRef = this.validateTypeReference(node)
    const [innerType] = this.extractTypeArguments(typeRef)

    return GenericTypeUtils.makeTypeCall('Required', [getTypeBoxType(innerType, context)])
  }
}
