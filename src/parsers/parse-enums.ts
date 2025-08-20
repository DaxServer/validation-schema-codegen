import { VariableDeclarationKind, EnumDeclaration } from 'ts-morph'
import { addStaticTypeAlias } from '../utils/add-static-type-alias'
import { BaseParser } from './base-parser'

export class EnumParser extends BaseParser {
  parse(enumDeclaration: EnumDeclaration): void {
    const typeName = enumDeclaration.getName()
    const enumText = enumDeclaration.getText()
    const isExported = this.getIsExported(enumDeclaration)
    this.newSourceFile.addStatements(isExported ? `export ${enumText}` : enumText)

    this.newSourceFile.addVariableStatement({
      isExported,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: typeName,
          initializer: `Type.Enum(${typeName})`,
        },
      ],
    })

    addStaticTypeAlias(
      this.newSourceFile,
      typeName,
      this.newSourceFile.compilerNode,
      this.printer,
      isExported,
    )
  }
}
