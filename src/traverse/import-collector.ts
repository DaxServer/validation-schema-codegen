import { FileGraph } from '@daxserver/validation-schema-codegen/traverse/file-graph'
import { NodeGraph } from '@daxserver/validation-schema-codegen/traverse/node-graph'
import { resolverStore } from '@daxserver/validation-schema-codegen/utils/resolver-store'
import { ImportDeclaration } from 'ts-morph'

export class ImportCollector {
  constructor(
    private fileGraph: FileGraph,
    private nodeGraph: NodeGraph,
  ) {}

  collectFromImports(importDeclarations: ImportDeclaration[]): void {
    for (const importDecl of importDeclarations) {
      const moduleSourceFile = importDecl.getModuleSpecifierSourceFile()
      if (!moduleSourceFile) continue

      const filePath = moduleSourceFile.getFilePath()

      // Prevent infinite loops by tracking visited files
      if (this.fileGraph.hasNode(filePath)) continue
      this.fileGraph.addFile(filePath, moduleSourceFile)

      // Build alias map specific to this import declaration
      const aliasMap = new Map<string, string>() // originalName -> aliasName
      const namedImports = importDecl.getNamedImports()
      for (const namedImport of namedImports) {
        const originalName = namedImport.getName()
        const aliasName = namedImport.getAliasNode()?.getText()
        if (aliasName) {
          aliasMap.set(originalName, aliasName)
        }
      }

      const imports = moduleSourceFile.getImportDeclarations()
      const typeAliases = moduleSourceFile.getTypeAliases()
      const interfaces = moduleSourceFile.getInterfaces()
      const enums = moduleSourceFile.getEnums()
      const functions = moduleSourceFile.getFunctions()

      // Add all imported types to the graph
      for (const typeAlias of typeAliases) {
        const typeName = typeAlias.getName()
        const qualifiedName = resolverStore.generateQualifiedName(
          typeName,
          typeAlias.getSourceFile(),
        )
        const aliasName = aliasMap.get(typeName)
        this.nodeGraph.addTypeNode(qualifiedName, {
          node: typeAlias,
          type: 'typeAlias',
          originalName: typeName,
          qualifiedName,
          isImported: true,
          isMainCode: false,
          aliasName,
        })

        // Add to ResolverStore during traversal
        resolverStore.addTypeMapping({
          originalName: typeName,
          sourceFile: typeAlias.getSourceFile(),
          aliasName,
        })
      }

      for (const interfaceDecl of interfaces) {
        const interfaceName = interfaceDecl.getName()
        const qualifiedName = resolverStore.generateQualifiedName(
          interfaceName,
          interfaceDecl.getSourceFile(),
        )
        const aliasName = aliasMap.get(interfaceName)
        this.nodeGraph.addTypeNode(qualifiedName, {
          node: interfaceDecl,
          type: 'interface',
          originalName: interfaceName,
          qualifiedName,
          isImported: true,
          isMainCode: false,
          aliasName,
        })

        // Add to ResolverStore during traversal
        resolverStore.addTypeMapping({
          originalName: interfaceName,
          sourceFile: interfaceDecl.getSourceFile(),
          aliasName,
        })
      }

      for (const enumDecl of enums) {
        const enumName = enumDecl.getName()
        const qualifiedName = resolverStore.generateQualifiedName(
          enumName,
          enumDecl.getSourceFile(),
        )
        const aliasName = aliasMap.get(enumName)
        this.nodeGraph.addTypeNode(qualifiedName, {
          node: enumDecl,
          type: 'enum',
          originalName: enumName,
          qualifiedName,
          isImported: true,
          isMainCode: false,
          aliasName,
        })

        // Add to ResolverStore during traversal
        resolverStore.addTypeMapping({
          originalName: enumName,
          sourceFile: enumDecl.getSourceFile(),
          aliasName,
        })
      }

      for (const functionDecl of functions) {
        const functionName = functionDecl.getName()
        if (!functionName) continue

        const qualifiedName = resolverStore.generateQualifiedName(
          functionName,
          functionDecl.getSourceFile(),
        )
        this.nodeGraph.addTypeNode(qualifiedName, {
          node: functionDecl,
          type: 'function',
          originalName: functionName,
          qualifiedName,
          isImported: true,
          isMainCode: false,
        })

        // Add to ResolverStore during traversal
        resolverStore.addTypeMapping({
          originalName: functionName,
          sourceFile: functionDecl.getSourceFile(),
        })
      }

      // Recursively collect from nested imports (mark as transitive)
      this.collectFromImports(imports)
    }
  }
}
