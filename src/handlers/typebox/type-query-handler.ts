import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { GenericTypeUtils } from '@daxserver/validation-schema-codegen/utils/generic-type-utils'
import { Node, ts, TypeQueryNode } from 'ts-morph'

export class TypeQueryHandler extends BaseTypeHandler {
  canHandle(node: Node): boolean {
    return Node.isTypeQuery(node)
  }

  handle(node: TypeQueryNode): ts.Expression {
    // For typeof expressions, we'll return the referenced type name
    // This is a simplified approach - in a more complete implementation,
    // we might want to resolve the actual type of the referenced entity
    const exprName = node.getExprName()

    if (Node.isIdentifier(exprName)) {
      const typeName = exprName.getText()
      return ts.factory.createIdentifier(typeName)
    }

    if (Node.isQualifiedName(exprName)) {
      // For qualified names like 'module.parsers', return the full name
      const fullName = exprName.getText()
      return ts.factory.createIdentifier(fullName.replace('.', '_'))
    }

    return GenericTypeUtils.makeTypeCall('Any')
  }
}
