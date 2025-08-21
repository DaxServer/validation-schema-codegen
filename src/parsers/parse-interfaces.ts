import { BaseParser } from '@daxserver/validation-schema-codegen/parsers/base-parser'
import { addStaticTypeAlias } from '@daxserver/validation-schema-codegen/utils/add-static-type-alias'
import { getTypeBoxType } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { InterfaceDeclaration, ts, VariableDeclarationKind } from 'ts-morph'

export class InterfaceParser extends BaseParser {
  parse(interfaceDecl: InterfaceDeclaration): void {
    this.parseWithImportFlag(interfaceDecl, false)
  }

  parseWithImportFlag(interfaceDecl: InterfaceDeclaration, isImported: boolean): void {
    this.parseInterfaceWithImportFlag(interfaceDecl, isImported)
  }

  private parseInterfaceWithImportFlag(
    interfaceDecl: InterfaceDeclaration,
    isImported: boolean,
  ): void {
    const interfaceName = interfaceDecl.getName()

    if (this.processedTypes.has(interfaceName)) {
      return
    }

    this.processedTypes.add(interfaceName)

    // Generate TypeBox type definition
    const typeboxTypeNode = getTypeBoxType(interfaceDecl)
    const typeboxType = this.printer.printNode(
      ts.EmitHint.Expression,
      typeboxTypeNode,
      this.newSourceFile.compilerNode,
    )

    const isExported = this.getIsExported(interfaceDecl, isImported)

    this.newSourceFile.addVariableStatement({
      isExported,
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
      isExported,
    )
  }
}
