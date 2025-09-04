import { BaseParser } from '@daxserver/validation-schema-codegen/parsers/base-parser'
import { GenericTypeUtils } from '@daxserver/validation-schema-codegen/utils/generic-type-utils'
import { getTypeBoxType } from '@daxserver/validation-schema-codegen/utils/typebox-call'

import { ts, TypeAliasDeclaration } from 'ts-morph'

export class TypeAliasParser extends BaseParser {
  parse(typeAlias: TypeAliasDeclaration, aliasName?: string): void {
    const typeName = aliasName || typeAlias.getName()

    if (this.processedTypes.has(typeName)) return
    this.processedTypes.add(typeName)

    const typeParameters = typeAlias.getTypeParameters()

    // Check if type alias has type parameters (generic)
    if (typeParameters.length > 0) {
      this.parseGenericTypeAlias(typeAlias, typeName)
    } else {
      this.parseRegularTypeAlias(typeAlias, typeName)
    }
  }

  private parseRegularTypeAlias(typeAlias: TypeAliasDeclaration, typeName: string): void {
    const typeNode = typeAlias.getTypeNode()
    const typeboxTypeNode = typeNode
      ? getTypeBoxType(typeNode, { nodeGraph: this.nodeGraph })
      : GenericTypeUtils.makeTypeCall('Any')
    const typeboxType = this.printer.printNode(
      ts.EmitHint.Expression,
      typeboxTypeNode,
      this.newSourceFile.compilerNode,
    )

    GenericTypeUtils.addTypeBoxVariableStatement(this.newSourceFile, typeName, typeboxType)
    GenericTypeUtils.addStaticTypeAlias(
      this.newSourceFile,
      typeName,
      this.newSourceFile.compilerNode,
      this.printer,
    )
  }

  private parseGenericTypeAlias(typeAlias: TypeAliasDeclaration, typeName: string): void {
    const typeParameters = typeAlias.getTypeParameters()

    // Generate TypeBox function definition
    const typeNode = typeAlias.getTypeNode()
    const typeboxTypeNode = typeNode
      ? getTypeBoxType(typeNode, { nodeGraph: this.nodeGraph })
      : GenericTypeUtils.makeTypeCall('Any')

    // Create the function expression using shared utilities
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
      typeName,
      functionExpressionText,
    )

    // Add generic type alias using shared utility
    GenericTypeUtils.addGenericTypeAlias(this.newSourceFile, typeName, typeParameters, this.printer)
  }
}
