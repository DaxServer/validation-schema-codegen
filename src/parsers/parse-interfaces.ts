import { BaseParser } from '@daxserver/validation-schema-codegen/parsers/base-parser'
import { addStaticTypeAlias } from '@daxserver/validation-schema-codegen/utils/add-static-type-alias'
import { getTypeBoxType } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import {
  InterfaceDeclaration,
  ts,
  TypeParameterDeclaration,
  VariableDeclarationKind,
} from 'ts-morph'

export class InterfaceParser extends BaseParser {
  parse(interfaceDecl: InterfaceDeclaration): void {
    const interfaceName = interfaceDecl.getName()

    if (this.processedTypes.has(interfaceName)) {
      return
    }

    this.processedTypes.add(interfaceName)

    const typeParameters = interfaceDecl.getTypeParameters()

    // Check if interface has type parameters (generic)
    if (typeParameters.length > 0) {
      this.parseGenericInterface(interfaceDecl)
    } else {
      this.parseRegularInterface(interfaceDecl)
    }
  }

  private parseRegularInterface(interfaceDecl: InterfaceDeclaration): void {
    const interfaceName = interfaceDecl.getName()

    // Generate TypeBox type definition
    const typeboxTypeNode = getTypeBoxType(interfaceDecl)
    const typeboxType = this.printer.printNode(
      ts.EmitHint.Expression,
      typeboxTypeNode,
      this.newSourceFile.compilerNode,
    )

    this.newSourceFile.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: interfaceName,
          initializer: typeboxType,
        },
      ],
    })

    addStaticTypeAlias(
      this.newSourceFile,
      interfaceName,
      this.newSourceFile.compilerNode,
      this.printer,
    )
  }

  private parseGenericInterface(interfaceDecl: InterfaceDeclaration): void {
    const interfaceName = interfaceDecl.getName()
    const typeParameters = interfaceDecl.getTypeParameters()

    // Generate TypeBox function definition
    const typeboxTypeNode = getTypeBoxType(interfaceDecl)
    const typeboxType = this.printer.printNode(
      ts.EmitHint.Expression,
      typeboxTypeNode,
      this.newSourceFile.compilerNode,
    )

    // Add the function declaration
    this.newSourceFile.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: interfaceName,
          initializer: typeboxType,
        },
      ],
    })

    // Add generic type alias: type A<T extends TSchema> = Static<ReturnType<typeof A<T>>>
    this.addGenericTypeAlias(interfaceName, typeParameters)
  }

  private addGenericTypeAlias(name: string, typeParameters: TypeParameterDeclaration[]): void {
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

    const staticType = this.printer.printNode(
      ts.EmitHint.Unspecified,
      staticTypeNode,
      this.newSourceFile.compilerNode,
    )

    this.newSourceFile.addTypeAlias({
      isExported: true,
      name,
      typeParameters: typeParamDeclarations.map((tp) =>
        this.printer.printNode(ts.EmitHint.Unspecified, tp, this.newSourceFile.compilerNode),
      ),
      type: staticType,
    })
  }
}
