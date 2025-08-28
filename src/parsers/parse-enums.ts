import { BaseParser } from '@daxserver/validation-schema-codegen/parsers/base-parser'
import { addStaticTypeAlias } from '@daxserver/validation-schema-codegen/utils/add-static-type-alias'
import { EnumDeclaration, VariableDeclarationKind } from 'ts-morph'

export class EnumParser extends BaseParser {
  parse(enumDeclaration: EnumDeclaration): void {
    const enumName = enumDeclaration.getName()

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
          name: enumName,
          initializer: typeboxType,
        },
      ],
    })

    addStaticTypeAlias(
      this.newSourceFile,
      enumName,
      this.newSourceFile.compilerNode,
      this.printer,
    )
  }
}
