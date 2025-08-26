import { ObjectLikeBaseHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/object/object-like-base-handler'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { HeritageClause, InterfaceDeclaration, Node, ts, TypeParameterDeclaration } from 'ts-morph'

export class InterfaceTypeHandler extends ObjectLikeBaseHandler {
  canHandle(node: Node): boolean {
    return Node.isInterfaceDeclaration(node)
  }

  handle(node: InterfaceDeclaration): ts.Expression {
    const typeParameters = node.getTypeParameters()
    const heritageClauses = node.getHeritageClauses()
    const baseObjectType = this.createObjectType(this.processProperties(node.getProperties()))

    // If interface has type parameters, generate a function
    if (typeParameters.length > 0) {
      return this.createGenericInterfaceFunction(typeParameters, baseObjectType, heritageClauses)
    }

    if (heritageClauses.length === 0) {
      return baseObjectType
    }

    const extendedTypes: ts.Expression[] = []

    for (const heritageClause of heritageClauses) {
      if (heritageClause.getToken() !== ts.SyntaxKind.ExtendsKeyword) {
        continue
      }

      for (const typeNode of heritageClause.getTypeNodes()) {
        const typeText = typeNode.getText()
        const genericCall = this.parseGenericTypeCall(typeText)
        if (genericCall) {
          extendedTypes.push(genericCall)
        } else {
          extendedTypes.push(ts.factory.createIdentifier(typeText))
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

  private createGenericInterfaceFunction(
    typeParameters: TypeParameterDeclaration[],
    baseObjectType: ts.Expression,
    heritageClauses: HeritageClause[],
  ): ts.Expression {
    // Create function parameters for each type parameter
    const functionParams = typeParameters.map((typeParam) => {
      const paramName = typeParam.getName()

      return ts.factory.createParameterDeclaration(
        undefined,
        undefined,
        ts.factory.createIdentifier(paramName),
        undefined,
        ts.factory.createTypeReferenceNode(paramName, undefined),
        undefined,
      )
    })

    // Create function body
    let functionBody: ts.Expression = baseObjectType

    // Handle heritage clauses for generic interfaces
    if (heritageClauses.length > 0) {
      const extendedTypes: ts.Expression[] = []

      for (const heritageClause of heritageClauses) {
        if (heritageClause.getToken() !== ts.SyntaxKind.ExtendsKeyword) {
          continue
        }

        for (const typeNode of heritageClause.getTypeNodes()) {
          const typeText = typeNode.getText()
          const genericCall = this.parseGenericTypeCall(typeText)
          if (genericCall) {
            extendedTypes.push(genericCall)
          } else {
            extendedTypes.push(ts.factory.createIdentifier(typeText))
          }
        }
      }

      if (extendedTypes.length > 0) {
        const allTypes = [...extendedTypes, baseObjectType]
        functionBody = makeTypeCall('Composite', [
          ts.factory.createArrayLiteralExpression(allTypes, true),
        ])
      }
    }

    // Create type parameters for the function
    const functionTypeParams = typeParameters.map((typeParam) => {
      const paramName = typeParam.getName()
      return ts.factory.createTypeParameterDeclaration(
        undefined,
        ts.factory.createIdentifier(paramName),
        ts.factory.createTypeReferenceNode('TSchema', undefined),
        undefined,
      )
    })

    // Create arrow function
    return ts.factory.createArrowFunction(
      undefined,
      ts.factory.createNodeArray(functionTypeParams),
      functionParams,
      undefined,
      ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
      functionBody,
    )
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
}
