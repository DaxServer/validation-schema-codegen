import { BaseParser } from '@daxserver/validation-schema-codegen/parsers/base-parser'
import { addStaticTypeAlias } from '@daxserver/validation-schema-codegen/utils/add-static-type-alias'
import { getTypeBoxType } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { ts, TypeAliasDeclaration, VariableDeclarationKind } from 'ts-morph'

export class TypeAliasParser extends BaseParser {
  parse(typeAlias: TypeAliasDeclaration): void {
    this.parseWithImportFlag(typeAlias)
  }

  parseWithImportFlag(typeAlias: TypeAliasDeclaration): void {
    const typeName = typeAlias.getName()

    const typeNode = typeAlias.getTypeNode()
    const typeboxTypeNode = typeNode ? getTypeBoxType(typeNode) : makeTypeCall('Any')
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
          name: typeName,
          initializer: typeboxType,
        },
      ],
    })

    addStaticTypeAlias(this.newSourceFile, typeName, this.newSourceFile.compilerNode, this.printer)
  }
}
