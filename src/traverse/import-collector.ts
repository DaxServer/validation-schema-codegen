import { FileGraph } from '@daxserver/validation-schema-codegen/traverse/file-graph'
import { NodeGraph } from '@daxserver/validation-schema-codegen/traverse/node-graph'
import { generateQualifiedNodeName } from '@daxserver/validation-schema-codegen/utils/generate-qualified-name'
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

      const imports = moduleSourceFile.getImportDeclarations()
      const typeAliases = moduleSourceFile.getTypeAliases()
      const interfaces = moduleSourceFile.getInterfaces()
      const enums = moduleSourceFile.getEnums()
      const functions = moduleSourceFile.getFunctions()

      // Add all imported types to the graph
      for (const typeAlias of typeAliases) {
        const typeName = typeAlias.getName()
        const qualifiedName = generateQualifiedNodeName(typeName, typeAlias.getSourceFile())
        this.nodeGraph.addTypeNode(qualifiedName, {
          node: typeAlias,
          type: 'typeAlias',
          originalName: typeName,
          qualifiedName,
          isImported: true,
          isMainCode: false,
        })
      }

      for (const interfaceDecl of interfaces) {
        const interfaceName = interfaceDecl.getName()
        const qualifiedName = generateQualifiedNodeName(
          interfaceName,
          interfaceDecl.getSourceFile(),
        )
        this.nodeGraph.addTypeNode(qualifiedName, {
          node: interfaceDecl,
          type: 'interface',
          originalName: interfaceName,
          qualifiedName,
          isImported: true,
          isMainCode: false,
        })
      }

      for (const enumDecl of enums) {
        const enumName = enumDecl.getName()
        const qualifiedName = generateQualifiedNodeName(enumName, enumDecl.getSourceFile())
        this.nodeGraph.addTypeNode(qualifiedName, {
          node: enumDecl,
          type: 'enum',
          originalName: enumName,
          qualifiedName,
          isImported: true,
          isMainCode: false,
        })
      }

      for (const functionDecl of functions) {
        const functionName = functionDecl.getName()
        if (!functionName) continue

        const qualifiedName = generateQualifiedNodeName(functionName, functionDecl.getSourceFile())
        this.nodeGraph.addTypeNode(qualifiedName, {
          node: functionDecl,
          type: 'function',
          originalName: functionName,
          qualifiedName,
          isImported: true,
          isMainCode: false,
        })
      }

      // Recursively collect from nested imports (mark as transitive)
      this.collectFromImports(imports)
    }
  }
}
