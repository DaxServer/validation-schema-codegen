import { Node, ts, InterfaceDeclaration } from 'ts-morph'
import { makeTypeCall } from '../../utils/typebox-codegen-utils'
import { BaseTypeHandler } from './base-type-handler'

export class InterfaceTypeHandler extends BaseTypeHandler {
  constructor(getTypeBoxType: (typeNode?: Node) => ts.Expression) {
    super(getTypeBoxType)
  }

  canHandle(typeNode?: Node): boolean {
    return Node.isInterfaceDeclaration(typeNode)
  }

  handle(typeNode: Node): ts.Expression {
    if (!Node.isInterfaceDeclaration(typeNode)) {
      return makeTypeCall('Any')
    }

    const interfaceDecl = typeNode as InterfaceDeclaration
    const properties: ts.PropertyAssignment[] = []

    for (const prop of interfaceDecl.getProperties()) {
      const propName = prop.getName()
      const propTypeNode = prop.getTypeNode()
      const valueExpr = this.getTypeBoxType(propTypeNode)
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

      properties.push(ts.factory.createPropertyAssignment(nameNode, maybeOptional))
    }

    const objectLiteral = ts.factory.createObjectLiteralExpression(properties, true)
    return makeTypeCall('Object', [objectLiteral])
  }
}
