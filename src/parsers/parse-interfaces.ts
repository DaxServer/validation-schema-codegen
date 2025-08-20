import { ts, InterfaceDeclaration, VariableDeclarationKind } from 'ts-morph'
import { addStaticTypeAlias } from '../utils/add-static-type-alias'
import { getTypeBoxType } from '../utils/typebox-call'
import { BaseParser } from './base-parser'

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
