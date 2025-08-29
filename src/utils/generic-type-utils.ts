import { SourceFile, ts, TypeParameterDeclaration, VariableDeclarationKind } from 'ts-morph'

/**
 * Utility functions for handling generic types in parsers
 */
export class GenericTypeUtils {
  /**
   * Adds a TypeBox variable statement to the source file
   */
  static addTypeBoxVariableStatement(
    newSourceFile: SourceFile,
    name: string,
    initializer: string,
  ): void {
    newSourceFile.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name,
          initializer,
        },
      ],
    })
  }
  /**
   * Creates function parameters for generic type parameters
   */
  static createFunctionParameters(
    typeParameters: TypeParameterDeclaration[],
  ): ts.ParameterDeclaration[] {
    return typeParameters.map((typeParam) => {
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
  }

  /**
   * Creates type parameters with TSchema constraints for generic functions
   */
  static createFunctionTypeParameters(
    typeParameters: TypeParameterDeclaration[],
  ): ts.TypeParameterDeclaration[] {
    return typeParameters.map((typeParam) => {
      const paramName = typeParam.getName()
      const constraintNode = ts.factory.createTypeReferenceNode('TSchema', undefined)

      return ts.factory.createTypeParameterDeclaration(
        undefined,
        ts.factory.createIdentifier(paramName),
        constraintNode,
        undefined,
      )
    })
  }

  /**
   * Creates an arrow function for generic types
   */
  static createGenericArrowFunction(
    typeParameters: TypeParameterDeclaration[],
    functionBody: ts.Expression,
  ): ts.Expression {
    const functionParams = this.createFunctionParameters(typeParameters)
    const functionTypeParams = this.createFunctionTypeParameters(typeParameters)

    return ts.factory.createArrowFunction(
      undefined,
      ts.factory.createNodeArray(functionTypeParams),
      functionParams,
      undefined,
      ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
      functionBody,
    )
  }

  /**
   * Adds a generic type alias to the source file
   * Generates: export type TypeName<T extends TSchema> = Static<ReturnType<typeof TypeName<T>>>
   */
  static addGenericTypeAlias(
    newSourceFile: SourceFile,
    name: string,
    typeParameters: TypeParameterDeclaration[],
    printer: ts.Printer,
  ): void {
    // Create type parameters for the type alias
    const typeParamDeclarations = typeParameters.map((typeParam) => {
      const paramName = typeParam.getName()
      // Use TSchema as the constraint for TypeBox compatibility
      const constraintNode = ts.factory.createTypeReferenceNode('TSchema', undefined)

      return ts.factory.createTypeParameterDeclaration(
        undefined,
        ts.factory.createIdentifier(paramName),
        constraintNode,
        undefined,
      )
    })

    // Create the type: Static<ReturnType<typeof A<T>>>
    const typeParamNames = typeParameters.map((tp) => tp.getName())
    const typeArguments = typeParamNames.map((paramName) =>
      ts.factory.createTypeReferenceNode(paramName, undefined),
    )

    // Create typeof A<T> expression - we need to create a type reference with type arguments
    const typeReferenceWithArgs = ts.factory.createTypeReferenceNode(
      ts.factory.createIdentifier(name),
      typeArguments,
    )

    const typeofExpression = ts.factory.createTypeQueryNode(
      typeReferenceWithArgs.typeName,
      typeReferenceWithArgs.typeArguments,
    )

    const returnTypeExpression = ts.factory.createTypeReferenceNode(
      ts.factory.createIdentifier('ReturnType'),
      [typeofExpression],
    )

    const staticTypeNode = ts.factory.createTypeReferenceNode(
      ts.factory.createIdentifier('Static'),
      [returnTypeExpression],
    )

    const staticType = printer.printNode(
      ts.EmitHint.Unspecified,
      staticTypeNode,
      newSourceFile.compilerNode,
    )

    newSourceFile.addTypeAlias({
      isExported: true,
      name,
      typeParameters: typeParamDeclarations.map((tp) =>
        printer.printNode(ts.EmitHint.Unspecified, tp, newSourceFile.compilerNode),
      ),
      type: staticType,
    })
  }
}
