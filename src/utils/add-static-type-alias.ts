import { TypeBoxStatic } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { SourceFile, ts } from 'ts-morph'

export const addStaticTypeAlias = (
  newSourceFile: SourceFile,
  name: string,
  compilerNode: ts.SourceFile,
  printer: ts.Printer,
) => {
  const staticTypeNode = ts.factory.createTypeReferenceNode(
    ts.factory.createIdentifier(TypeBoxStatic),
    [ts.factory.createTypeQueryNode(ts.factory.createIdentifier(name))],
  )

  const staticType = printer.printNode(ts.EmitHint.Unspecified, staticTypeNode, compilerNode)

  newSourceFile.addTypeAlias({
    isExported: true,
    name,
    type: staticType,
  })
}
