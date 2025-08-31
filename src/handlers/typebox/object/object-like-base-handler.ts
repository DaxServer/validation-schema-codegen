import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { isValidIdentifier } from '@daxserver/validation-schema-codegen/utils/identifier-utils'
import { getTypeBoxType } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { Node, PropertySignature, ts } from 'ts-morph'

export abstract class ObjectLikeBaseHandler extends BaseTypeHandler {
  protected processProperties(properties: PropertySignature[]): ts.PropertyAssignment[] {
    const propertyAssignments: ts.PropertyAssignment[] = []

    for (const prop of properties) {
      const propTypeNode = prop.getTypeNode()
      if (!propTypeNode) continue

      const outputNameNode = this.extractPropertyNameInfo(prop)
      const valueExpr = getTypeBoxType(propTypeNode)
      const isAlreadyOptional =
        ts.isCallExpression(valueExpr) &&
        ts.isPropertyAccessExpression(valueExpr.expression) &&
        valueExpr.expression.name.text === 'Optional'

      const maybeOptional =
        prop.hasQuestionToken() && !isAlreadyOptional
          ? makeTypeCall('Optional', [valueExpr])
          : valueExpr

      propertyAssignments.push(ts.factory.createPropertyAssignment(outputNameNode, maybeOptional))
    }

    return propertyAssignments
  }

  protected createObjectType(properties: ts.PropertyAssignment[]): ts.Expression {
    const objectLiteral = ts.factory.createObjectLiteralExpression(properties, true)

    return makeTypeCall('Object', [objectLiteral])
  }

  private extractPropertyNameInfo(prop: PropertySignature): ts.PropertyName {
    const nameNode = prop.getNameNode()
    let propName: string
    let shouldUseIdentifier: boolean

    if (Node.isIdentifier(nameNode)) {
      // If it was originally an identifier, keep it as an identifier
      propName = nameNode.getText()
      shouldUseIdentifier = true
    } else if (Node.isStringLiteral(nameNode)) {
      // For quoted properties, get the literal value and check if it can be an identifier
      propName = nameNode.getLiteralValue()
      shouldUseIdentifier = isValidIdentifier(propName)
    } else if (Node.isNumericLiteral(nameNode)) {
      // Numeric properties can be used as identifiers
      propName = nameNode.getLiteralValue().toString()
      shouldUseIdentifier = true
    } else {
      // Fallback for any other cases
      propName = prop.getName()
      shouldUseIdentifier = isValidIdentifier(propName)
    }

    return shouldUseIdentifier
      ? ts.factory.createIdentifier(propName)
      : ts.factory.createStringLiteral(propName)
  }
}
