import {
  createChunkNodes,
  shouldChunkUnion,
} from '@daxserver/validation-schema-codegen/traverse/chunk-large-types'
import { NodeGraph } from '@daxserver/validation-schema-codegen/traverse/node-graph'
import { resolverStore } from '@daxserver/validation-schema-codegen/utils/resolver-store'
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
          const qualifiedName = resolverStore.generateQualifiedName(importName, importSourceFile)
          requiredNodeIds.add(qualifiedName)
        }
      }
    }

    return
  }

  // Collect type aliases
  for (const typeAlias of typeAliases) {
    const typeName = typeAlias.getName()
    const qualifiedName = resolverStore.generateQualifiedName(typeName, typeAlias.getSourceFile())
    maincodeNodeIds.add(qualifiedName)
    requiredNodeIds.add(qualifiedName)

    // Check if this type alias contains a large union that needs chunking
    const typeNode = typeAlias.getTypeNode()
    if (typeNode && shouldChunkUnion(typeNode)) {
      // Create chunk nodes for large union
      const chunkReferences = createChunkNodes(
        typeNode,
        typeName,
        nodeGraph,
        maincodeNodeIds,
        requiredNodeIds,
        sourceFile,
      )

      // Add the main type as a regular type alias that will be handled by chunk parser
      nodeGraph.addTypeNode(qualifiedName, {
        node: typeAlias,
        type: 'typeAlias',
        originalName: typeName,
        qualifiedName,
        isImported: false,
        isMainCode: true,
        chunkReferences: chunkReferences,
      })
    } else {
      nodeGraph.addTypeNode(qualifiedName, {
        node: typeAlias,
        type: 'typeAlias',
        originalName: typeName,
        qualifiedName,
        isImported: false,
        isMainCode: true,
      })
    }

    // Add to ResolverStore during traversal
    resolverStore.addTypeMapping({
      originalName: typeName,
      sourceFile,
    })
  }

  // Collect interfaces
  for (const interfaceDecl of interfaces) {
    const interfaceName = interfaceDecl.getName()
    const qualifiedName = resolverStore.generateQualifiedName(
      interfaceName,
      interfaceDecl.getSourceFile(),
    )
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

    // Add to ResolverStore during traversal
    resolverStore.addTypeMapping({
      originalName: interfaceName,
      sourceFile: interfaceDecl.getSourceFile(),
    })
  }

  // Collect enums
  for (const enumDecl of enums) {
    const enumName = enumDecl.getName()
    const qualifiedName = resolverStore.generateQualifiedName(enumName, enumDecl.getSourceFile())
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

    // Add to ResolverStore during traversal
    resolverStore.addTypeMapping({
      originalName: enumName,
      sourceFile: enumDecl.getSourceFile(),
    })
  }

  // Collect functions
  for (const functionDecl of functions) {
    const functionName = functionDecl.getName()
    if (!functionName) continue

    const qualifiedName = resolverStore.generateQualifiedName(
      functionName,
      functionDecl.getSourceFile(),
    )
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

    // Add to ResolverStore during traversal
    resolverStore.addTypeMapping({
      originalName: functionName,
      sourceFile: functionDecl.getSourceFile(),
    })
  }
}
