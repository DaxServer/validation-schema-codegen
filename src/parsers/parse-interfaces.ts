import { BaseParser } from '@daxserver/validation-schema-codegen/parsers/base-parser'
import { GenericTypeUtils } from '@daxserver/validation-schema-codegen/utils/generic-type-utils'
import { getTypeBoxType } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { InterfaceDeclaration, ts } from 'ts-morph'

export class InterfaceParser extends BaseParser {
  parse(interfaceDecl: InterfaceDeclaration, aliasName?: string): void {
    const interfaceName = aliasName || interfaceDecl.getName()

    if (this.processedTypes.has(interfaceName)) return
    this.processedTypes.add(interfaceName)

    const typeParameters = interfaceDecl.getTypeParameters()

    // Check if interface has type parameters (generic)
    if (typeParameters.length > 0) {
      this.parseGenericInterface(interfaceDecl, interfaceName)
    } else {
      this.parseRegularInterface(interfaceDecl, interfaceName)
    }
  }

  private parseRegularInterface(interfaceDecl: InterfaceDeclaration, interfaceName: string): void {
    // Generate TypeBox type definition
    const typeboxTypeNode = getTypeBoxType(interfaceDecl, { nodeGraph: this.nodeGraph })
    const typeboxType = this.printer.printNode(
      ts.EmitHint.Expression,
      typeboxTypeNode,
      this.newSourceFile.compilerNode,
    )

    GenericTypeUtils.addTypeBoxVariableStatement(this.newSourceFile, interfaceName, typeboxType)
    GenericTypeUtils.addStaticTypeAlias(
      this.newSourceFile,
      interfaceName,
      this.newSourceFile.compilerNode,
      this.printer,
    )
  }

  private parseGenericInterface(interfaceDecl: InterfaceDeclaration, interfaceName: string): void {
    const typeParameters = interfaceDecl.getTypeParameters()

    // Generate TypeBox function definition using the same flow as type aliases
    const typeboxTypeNode = getTypeBoxType(interfaceDecl, { nodeGraph: this.nodeGraph })

    // Create the function expression using shared utilities (mirrors type-alias flow)
    const functionExpression = GenericTypeUtils.createGenericArrowFunction(
      typeParameters,
      typeboxTypeNode,
    )

    const functionExpressionText = this.printer.printNode(
      ts.EmitHint.Expression,
      functionExpression,
      this.newSourceFile.compilerNode,
    )

    // Add the function declaration
    GenericTypeUtils.addTypeBoxVariableStatement(
      this.newSourceFile,
      interfaceName,
      functionExpressionText,
    )

    // Add generic type alias using shared utility
    GenericTypeUtils.addGenericTypeAlias(
      this.newSourceFile,
      interfaceName,
      typeParameters,
      this.printer,
    )
  }
}
