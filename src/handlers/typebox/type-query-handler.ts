import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { Node, ts } from 'ts-morph'

export class TypeQueryHandler extends BaseTypeHandler {
  constructor(getTypeBoxType: (typeNode?: Node) => ts.Expression) {
    super(getTypeBoxType)
  }

  canHandle(typeNode?: Node): boolean {
    return Node.isTypeQuery(typeNode)
  }

  handle(typeNode: Node): ts.Expression {
    if (!Node.isTypeQuery(typeNode)) {
      return makeTypeCall('Any')
    }

    // For typeof expressions, we'll return the referenced type name
    // This is a simplified approach - in a more complete implementation,
    // we might want to resolve the actual type of the referenced entity
    const exprName = typeNode.getExprName()

    if (Node.isIdentifier(exprName)) {
      const typeName = exprName.getText()
      return ts.factory.createIdentifier(typeName)
    }

    if (Node.isQualifiedName(exprName)) {
      // For qualified names like 'module.parsers', return the full name
      const fullName = exprName.getText()
      return ts.factory.createIdentifier(fullName.replace('.', '_'))
    }

    return makeTypeCall('Any')
  }
}
