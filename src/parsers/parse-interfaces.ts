import { BaseParser } from '@daxserver/validation-schema-codegen/parsers/base-parser'
import { addStaticTypeAlias } from '@daxserver/validation-schema-codegen/utils/add-static-type-alias'
import { GenericTypeUtils } from '@daxserver/validation-schema-codegen/utils/generic-type-utils'
import { getTypeBoxType } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { InterfaceDeclaration, ts } from 'ts-morph'

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

    GenericTypeUtils.addTypeBoxVariableStatement(this.newSourceFile, interfaceName, typeboxType)

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
    GenericTypeUtils.addTypeBoxVariableStatement(this.newSourceFile, interfaceName, typeboxType)

    // Add generic type alias using shared utility
    GenericTypeUtils.addGenericTypeAlias(
      this.newSourceFile,
      interfaceName,
      typeParameters,
      this.printer,
    )
  }
}
