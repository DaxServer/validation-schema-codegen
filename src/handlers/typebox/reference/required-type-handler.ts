import { TypeReferenceBaseHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/reference/type-reference-base-handler'
import { getTypeBoxType } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { Node, ts } from 'ts-morph'

export class RequiredTypeHandler extends TypeReferenceBaseHandler {
  protected readonly supportedTypeNames = ['Required']
  protected readonly expectedArgumentCount = 1

  handle(node: Node): ts.Expression {
    const typeRef = this.validateTypeReference(node)
    const [innerType] = this.extractTypeArguments(typeRef)

    return makeTypeCall('Required', [getTypeBoxType(innerType)])
  }
}
