import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { getTypeBoxType } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { PropertySignature, ts } from 'ts-morph'

export abstract class ObjectLikeBaseHandler extends BaseTypeHandler {
  protected processProperties(properties: PropertySignature[]): ts.PropertyAssignment[] {
    const propertyAssignments: ts.PropertyAssignment[] = []

    for (const prop of properties) {
      const propName = prop.getName()
      const propTypeNode = prop.getTypeNode()

      if (!propTypeNode) {
        continue
      }

      const valueExpr = getTypeBoxType(propTypeNode)
      const isAlreadyOptional =
        ts.isCallExpression(valueExpr) &&
        ts.isPropertyAccessExpression(valueExpr.expression) &&
        valueExpr.expression.name.text === 'Optional'

      const maybeOptional =
        prop.hasQuestionToken() && !isAlreadyOptional
          ? makeTypeCall('Optional', [valueExpr])
          : valueExpr

      const nameNode = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(propName)
        ? ts.factory.createIdentifier(propName)
        : ts.factory.createStringLiteral(propName)

      propertyAssignments.push(ts.factory.createPropertyAssignment(nameNode, maybeOptional))
    }

    return propertyAssignments
  }

  protected createObjectType(properties: ts.PropertyAssignment[]): ts.Expression {
    const objectLiteral = ts.factory.createObjectLiteralExpression(properties, true)

    return makeTypeCall('Object', [objectLiteral])
  }
}
