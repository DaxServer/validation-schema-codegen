import { BaseParser } from '@daxserver/validation-schema-codegen/parsers/base-parser'
import { addStaticTypeAlias } from '@daxserver/validation-schema-codegen/utils/add-static-type-alias'
import { EnumDeclaration, VariableDeclarationKind } from 'ts-morph'

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
