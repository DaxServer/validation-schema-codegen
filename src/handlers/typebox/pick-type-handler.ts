import { Node, ts } from 'ts-morph'
import { makeTypeCall } from '../../utils/typebox-codegen-utils'
import { BaseTypeHandler } from './base-type-handler'

export class PickTypeHandler extends BaseTypeHandler {
  constructor(getTypeBoxType: (typeNode?: Node) => ts.Expression) {
    super(getTypeBoxType)
  }

  canHandle(typeNode?: Node): boolean {
    if (!Node.isTypeReference(typeNode)) {
      return false
    }
    const referencedType = typeNode.getTypeName()
    return Node.isIdentifier(referencedType) && referencedType.getText() === 'Pick'
  }

  handle(typeNode: Node): ts.Expression {
    if (!Node.isTypeReference(typeNode) || typeNode.getTypeArguments().length !== 2) {
      return makeTypeCall('Any')
    }
    const [objectType, keysType] = typeNode.getTypeArguments()
    if (!keysType) {
      return makeTypeCall('Any')
    }
    const typeboxObjectType = this.getTypeBoxType(objectType)

    let pickKeys: string[] = []
    if (Node.isUnionTypeNode(keysType)) {
      pickKeys = keysType.getTypeNodes().map((unionType) => {
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
        pickKeys = [literalExpression.getLiteralText()]
      }
    }

    let typeboxKeys: ts.Expression
    if (pickKeys.length === 1) {
      typeboxKeys = makeTypeCall('Literal', [ts.factory.createStringLiteral(pickKeys[0]!)])
    } else {
      typeboxKeys = makeTypeCall('Union', [
        ts.factory.createArrayLiteralExpression(
          pickKeys.map((k) => makeTypeCall('Literal', [ts.factory.createStringLiteral(k)])),
          false,
        ),
      ])
    }
    return makeTypeCall('Pick', [typeboxObjectType, typeboxKeys])
  }
}
