import { SourceFile, ts } from 'ts-morph'

export const addStaticTypeAlias = (
  newSourceFile: SourceFile,
  name: string,
  compilerNode: ts.SourceFile,
  printer: ts.Printer,
) => {
  const staticTypeNode = ts.factory.createTypeReferenceNode(ts.factory.createIdentifier('Static'), [
    ts.factory.createTypeQueryNode(ts.factory.createIdentifier(name)),
  ])

  const staticType = printer.printNode(ts.EmitHint.Unspecified, staticTypeNode, compilerNode)

  newSourceFile.addTypeAlias({
    isExported: true,
    name,
    type: staticType,
  })
}
