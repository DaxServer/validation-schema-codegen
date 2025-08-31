import { NodeGraph } from '@daxserver/validation-schema-codegen/traverse/node-graph'
import { generateQualifiedNodeName } from '@daxserver/validation-schema-codegen/utils/generate-qualified-name'
import { SourceFile } from 'ts-morph'

export const addLocalTypes = (
  sourceFile: SourceFile,
  nodeGraph: NodeGraph,
  maincodeNodeIds: Set<string>,
  requiredNodeIds: Set<string>,
): void => {
  const typeAliases = sourceFile.getTypeAliases()
  const interfaces = sourceFile.getInterfaces()
  const enums = sourceFile.getEnums()
  const functions = sourceFile.getFunctions()

  // If main file has no local types but has imports, add all imported types as required
  if (
    typeAliases.length === 0 &&
    interfaces.length === 0 &&
    enums.length === 0 &&
    functions.length === 0
  ) {
    const importDeclarations = sourceFile.getImportDeclarations()
    for (const importDecl of importDeclarations) {
      const namedImports = importDecl.getNamedImports()
      for (const namedImport of namedImports) {
        const importName = namedImport.getName()
        const importSourceFile = importDecl.getModuleSpecifierSourceFile()
        if (importSourceFile) {
          const qualifiedName = generateQualifiedNodeName(importName, importSourceFile)
          requiredNodeIds.add(qualifiedName)
        }
      }
    }

    return
  }

  // Collect type aliases
  for (const typeAlias of typeAliases) {
    const typeName = typeAlias.getName()
    const qualifiedName = generateQualifiedNodeName(typeName, typeAlias.getSourceFile())
    maincodeNodeIds.add(qualifiedName)
    requiredNodeIds.add(qualifiedName)
    nodeGraph.addTypeNode(qualifiedName, {
      node: typeAlias,
      type: 'typeAlias',
      originalName: typeName,
      qualifiedName,
      isImported: false,
      isMainCode: true,
    })
  }

  // Collect interfaces
  for (const interfaceDecl of interfaces) {
    const interfaceName = interfaceDecl.getName()
    const qualifiedName = generateQualifiedNodeName(interfaceName, interfaceDecl.getSourceFile())
    maincodeNodeIds.add(qualifiedName)
    requiredNodeIds.add(qualifiedName)
    nodeGraph.addTypeNode(qualifiedName, {
      node: interfaceDecl,
      type: 'interface',
      originalName: interfaceName,
      qualifiedName,
      isImported: false,
      isMainCode: true,
    })
  }

  // Collect enums
  for (const enumDecl of enums) {
    const enumName = enumDecl.getName()
    const qualifiedName = generateQualifiedNodeName(enumName, enumDecl.getSourceFile())
    maincodeNodeIds.add(qualifiedName)
    requiredNodeIds.add(qualifiedName)
    nodeGraph.addTypeNode(qualifiedName, {
      node: enumDecl,
      type: 'enum',
      originalName: enumName,
      qualifiedName,
      isImported: false,
      isMainCode: true,
    })
  }

  // Collect functions
  for (const functionDecl of functions) {
    const functionName = functionDecl.getName()
    if (!functionName) continue

    const qualifiedName = generateQualifiedNodeName(functionName, functionDecl.getSourceFile())
    maincodeNodeIds.add(qualifiedName)
    requiredNodeIds.add(qualifiedName)
    nodeGraph.addTypeNode(qualifiedName, {
      node: functionDecl,
      type: 'function',
      originalName: functionName,
      qualifiedName,
      isImported: false,
      isMainCode: true,
    })
  }
}
