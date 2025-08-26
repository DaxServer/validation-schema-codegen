import { BaseParser } from '@daxserver/validation-schema-codegen/parsers/base-parser'
import { addStaticTypeAlias } from '@daxserver/validation-schema-codegen/utils/add-static-type-alias'
import { getTypeBoxType } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { ts, TypeAliasDeclaration, VariableDeclarationKind } from 'ts-morph'

export class TypeAliasParser extends BaseParser {
  parse(typeAlias: TypeAliasDeclaration): void {
    this.parseWithImportFlag(typeAlias, false)
  }

  parseWithImportFlag(typeAlias: TypeAliasDeclaration, isImported: boolean): void {
    const typeName = typeAlias.getName()

    if (this.processedTypes.has(typeName)) {
      return
    }

    this.processedTypes.add(typeName)

    const typeNode = typeAlias.getTypeNode()
    const typeboxTypeNode = typeNode ? getTypeBoxType(typeNode) : makeTypeCall('Any')
    const typeboxType = this.printer.printNode(
      ts.EmitHint.Expression,
      typeboxTypeNode,
      this.newSourceFile.compilerNode,
    )

    const isExported = this.getIsExported(typeAlias, isImported)

    this.newSourceFile.addVariableStatement({
      isExported,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: typeName,
          initializer: typeboxType,
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
