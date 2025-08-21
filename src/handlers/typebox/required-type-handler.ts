import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { Node, ts } from 'ts-morph'

export class RequiredTypeHandler extends BaseTypeHandler {
  canHandle(typeNode: Node | undefined): boolean {
    if (!typeNode) {
      return false
    }
    const typeReferenceNode = typeNode.asKind(ts.SyntaxKind.TypeReference)
    if (!typeReferenceNode) {
      return false
    }
    const typeName = typeReferenceNode.getTypeName()
    const typeArguments = typeReferenceNode.getTypeArguments()
    return typeName.getText() === 'Required' && typeArguments.length === 1
  }

  handle(typeNode: Node | undefined): ts.Expression {
    if (!typeNode) {
      throw new Error('Type node is undefined.')
    }
    const typeReferenceNode = typeNode.asKindOrThrow(ts.SyntaxKind.TypeReference)
    const typeArguments = typeReferenceNode.getTypeArguments()

    if (typeArguments.length !== 1) {
      throw new Error('Required utility type expects exactly one type argument.')
    }

    const targetType = typeArguments[0]
    const typeboxType = this.getTypeBoxType(targetType)

    if (!typeboxType) {
      throw new Error(
        `Could not determine TypeBox type for Required argument: ${targetType ? targetType.getText() : 'undefined'}`,
      )
    }

    return ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier('Type'),
        ts.factory.createIdentifier('Required'),
      ),
      undefined,
      [typeboxType],
    )
  }
}
