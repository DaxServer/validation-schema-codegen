import { TypeReferenceBaseHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/reference/type-reference-base-handler'
import { getTypeBoxType } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { Node, ts } from 'ts-morph'

export class OmitTypeHandler extends TypeReferenceBaseHandler {
  protected supportedTypeNames = ['Omit']
  protected expectedArgumentCount = 2

  handle(node: Node): ts.Expression {
    const typeRef = this.validateTypeReference(node)
    const [objectType, keysType] = this.extractTypeArguments(typeRef)

    if (!keysType) {
      return makeTypeCall('Any')
    }

    const typeboxObjectType = getTypeBoxType(objectType)

    let omitKeys: string[] = []
    if (Node.isUnionTypeNode(keysType)) {
      omitKeys = keysType.getTypeNodes().map((unionType) => {
        if (Node.isLiteralTypeNode(unionType)) {
          const literalExpression = unionType.getLiteral()
          if (Node.isStringLiteral(literalExpression)) {
            return literalExpression.getLiteralText()
          }
        }
        return '' // Should not happen if keys are string literals
      })
    } else if (Node.isLiteralTypeNode(keysType)) {
      const literalExpression = keysType.getLiteral()
      if (Node.isStringLiteral(literalExpression)) {
        omitKeys = [literalExpression.getLiteralText()]
      }
    }

    let typeboxKeys: ts.Expression
    if (omitKeys.length === 1) {
      typeboxKeys = makeTypeCall('Literal', [ts.factory.createStringLiteral(omitKeys[0]!)])
    } else {
      typeboxKeys = makeTypeCall('Union', [
        ts.factory.createArrayLiteralExpression(
          omitKeys.map((k) => makeTypeCall('Literal', [ts.factory.createStringLiteral(k)])),
          true,
        ),
      ])
    }

    return makeTypeCall('Omit', [typeboxObjectType, typeboxKeys])
  }
}
