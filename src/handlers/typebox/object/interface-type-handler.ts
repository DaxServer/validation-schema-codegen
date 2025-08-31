import { ObjectLikeBaseHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/object/object-like-base-handler'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { HeritageClause, InterfaceDeclaration, Node, ts } from 'ts-morph'

export class InterfaceTypeHandler extends ObjectLikeBaseHandler {
  canHandle(node: Node): boolean {
    return Node.isInterfaceDeclaration(node)
  }

  handle(node: InterfaceDeclaration): ts.Expression {
    const heritageClauses = node.getHeritageClauses()
    const baseObjectType = this.createObjectType(this.processProperties(node.getProperties()))

    if (heritageClauses.length === 0) return baseObjectType

    const extendedTypes = this.collectExtendedTypes(heritageClauses)
    if (extendedTypes.length === 0) return baseObjectType

    // Create composite with extended types first, then the current interface
    const allTypes = [...extendedTypes, baseObjectType]
    const expression = ts.factory.createArrayLiteralExpression(allTypes, true)

    return makeTypeCall('Composite', [expression])
  }

  private parseGenericTypeCall(typeText: string): ts.Expression | null {
    const match = typeText.match(/^([^<]+)<([^>]+)>$/)

    if (match && match[1] && match[2]) {
      const baseName = match[1].trim()
      const typeArg = match[2].trim()

      return ts.factory.createCallExpression(ts.factory.createIdentifier(baseName), undefined, [
        this.createTypeExpression(typeArg),
      ])
    }

    return null
  }

  private createTypeExpression(typeArg: string): ts.Expression {
    // Convert common TypeScript types to TypeBox calls
    switch (typeArg) {
      case 'number':
        return makeTypeCall('Number')
      case 'string':
        return makeTypeCall('String')
      case 'boolean':
        return makeTypeCall('Boolean')
      default:
        // For other types, assume it's a reference
        return ts.factory.createIdentifier(typeArg)
    }
  }

  private collectExtendedTypes(heritageClauses: HeritageClause[]): ts.Expression[] {
    const extendedTypes: ts.Expression[] = []

    for (const heritageClause of heritageClauses) {
      if (heritageClause.getToken() !== ts.SyntaxKind.ExtendsKeyword) continue

      for (const typeNode of heritageClause.getTypeNodes()) {
        const typeText = typeNode.getText()
        extendedTypes.push(
          this.parseGenericTypeCall(typeText) ?? ts.factory.createIdentifier(typeText),
        )
      }
    }

    return extendedTypes
  }
}
