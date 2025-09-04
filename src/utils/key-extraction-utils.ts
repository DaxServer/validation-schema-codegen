import { GenericTypeUtils } from '@daxserver/validation-schema-codegen/utils/generic-type-utils'
import { Node, ts } from 'ts-morph'

/**
 * Extracts string keys from a TypeScript type node (typically used for Pick/Omit key types)
 * Handles both single literal types and union types containing string literals
 */
export const extractStringKeys = (keysType: Node): string[] => {
  const keys: string[] = []

  if (Node.isUnionTypeNode(keysType)) {
    for (const unionType of keysType.getTypeNodes()) {
      if (Node.isLiteralTypeNode(unionType)) {
        const literalExpression = unionType.getLiteral()
        if (Node.isStringLiteral(literalExpression)) {
          keys.push(literalExpression.getLiteralText())
        }
      }
    }
  } else if (Node.isLiteralTypeNode(keysType)) {
    const literalExpression = keysType.getLiteral()
    if (Node.isStringLiteral(literalExpression)) {
      keys.push(literalExpression.getLiteralText())
    }
  }

  return keys
}

/**
 * Converts an array of string keys into a TypeBox expression
 * Returns a single Literal for one key, or a Union of Literals for multiple keys
 */
export const createTypeBoxKeys = (keys: string[]): ts.Expression => {
  if (keys.length === 1) {
    return GenericTypeUtils.makeTypeCall('Literal', [ts.factory.createStringLiteral(keys[0]!)])
  }

  return GenericTypeUtils.makeTypeCall('Union', [
    ts.factory.createArrayLiteralExpression(
      keys.map((k) =>
        GenericTypeUtils.makeTypeCall('Literal', [ts.factory.createStringLiteral(k)]),
      ),
    ),
  ])
}
