import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { Node, ts, TypeOperatorTypeNode, VariableDeclaration } from 'ts-morph'

export class KeyOfTypeofHandler extends BaseTypeHandler {
  canHandle(node: Node): boolean {
    return (
      Node.isTypeOperatorTypeNode(node) &&
      node.getOperator() === ts.SyntaxKind.KeyOfKeyword &&
      Node.isTypeQuery(node.getTypeNode())
    )
  }

  handle(node: TypeOperatorTypeNode): ts.Expression {
    const typeQuery = node.getTypeNode()
    if (!Node.isTypeQuery(typeQuery)) return makeTypeCall('Any')

    const exprName = typeQuery.getExprName()
    if (!Node.isIdentifier(exprName)) return makeTypeCall('Any')

    const keys = this.getObjectKeys(exprName)
    return keys.length > 0 ? this.createUnion(keys) : makeTypeCall('Any')
  }

  private getObjectKeys(node: Node): string[] {
    const sourceFile = node.getSourceFile()

    for (const varDecl of sourceFile.getVariableDeclarations()) {
      if (varDecl.getName() === node.getText()) {
        return this.extractKeys(varDecl)
      }
    }

    return []
  }

  private extractKeys(varDecl: VariableDeclaration): string[] {
    // Try object literal
    let initializer = varDecl.getInitializer()
    if (Node.isAsExpression(initializer)) {
      initializer = initializer.getExpression()
    }

    if (Node.isObjectLiteralExpression(initializer)) {
      return initializer
        .getProperties()
        .map((prop) => {
          if (Node.isPropertyAssignment(prop) || Node.isShorthandPropertyAssignment(prop)) {
            const name = prop.getName()
            return typeof name === 'string' ? name : null
          }
          return null
        })
        .filter((name): name is string => name !== null)
    }

    // Try type annotation
    const typeNode = varDecl.getTypeNode()
    if (Node.isTypeLiteral(typeNode)) {
      return typeNode
        .getMembers()
        .map((member) => {
          if (Node.isPropertySignature(member)) {
            const name = member.getName()
            return typeof name === 'string' ? name : null
          }
          return null
        })
        .filter((name): name is string => name !== null)
    }

    return []
  }

  private createUnion(keys: string[]): ts.Expression {
    const literals = keys.map((key) => {
      const num = Number(key)
      const literal =
        !isNaN(num) && key === String(num)
          ? ts.factory.createNumericLiteral(num)
          : ts.factory.createStringLiteral(key)

      return makeTypeCall('Literal', [literal])
    })

    return literals.length === 1
      ? literals[0]!
      : makeTypeCall('Union', [ts.factory.createArrayLiteralExpression(literals)])
  }
}
