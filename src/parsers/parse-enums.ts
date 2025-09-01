import { BaseParser } from '@daxserver/validation-schema-codegen/parsers/base-parser'
import { addStaticTypeAlias } from '@daxserver/validation-schema-codegen/utils/add-static-type-alias'
import { EnumDeclaration, VariableDeclarationKind } from 'ts-morph'

export class EnumParser extends BaseParser {
  parse(enumDeclaration: EnumDeclaration, aliasName?: string): void {
    const enumName = aliasName || enumDeclaration.getName()
    const schemaName = `${enumName}Schema`

    this.newSourceFile.addEnum({
      name: enumName,
      isExported: true,
      members: enumDeclaration.getMembers().map((member) => ({
        name: member.getName(),
        value: member.hasInitializer() ? member.getValue() : undefined,
      })),
    })

    // Generate TypeBox type
    const typeboxType = `Type.Enum(${enumName})`

    this.newSourceFile.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: schemaName,
          initializer: typeboxType,
        },
      ],
    })

    addStaticTypeAlias(
      this.newSourceFile,
      schemaName,
      this.newSourceFile.compilerNode,
      this.printer,
    )
  }
}
