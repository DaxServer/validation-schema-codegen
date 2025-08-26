import { ObjectLikeBaseHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/object/object-like-base-handler'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { InterfaceDeclaration, Node, ts } from 'ts-morph'

export class InterfaceTypeHandler extends ObjectLikeBaseHandler {
  canHandle(node: Node): boolean {
    return Node.isInterfaceDeclaration(node)
  }

  handle(node: InterfaceDeclaration): ts.Expression {
    const heritageClauses = node.getHeritageClauses()
    const baseObjectType = this.createObjectType(this.processProperties(node.getProperties()))

    if (heritageClauses.length === 0) {
      return baseObjectType
    }

    const extendedTypes: ts.Expression[] = []

    for (const heritageClause of heritageClauses) {
      if (heritageClause.getToken() === ts.SyntaxKind.ExtendsKeyword) {
        for (const typeNode of heritageClause.getTypeNodes()) {
          // For interface inheritance, we reference the already processed interface by name
          const referencedTypeName = typeNode.getText()
          extendedTypes.push(ts.factory.createIdentifier(referencedTypeName))
        }
      }
    }

    if (extendedTypes.length === 0) {
      return baseObjectType
    }

    // Create composite with extended types first, then the current interface
    const allTypes = [...extendedTypes, baseObjectType]

    return makeTypeCall('Composite', [ts.factory.createArrayLiteralExpression(allTypes, true)])
  }
}
