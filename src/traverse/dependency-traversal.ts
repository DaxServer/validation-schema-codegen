import { FileGraph } from '@daxserver/validation-schema-codegen/traverse/file-graph'
import { NodeGraph } from '@daxserver/validation-schema-codegen/traverse/node-graph'
import type { TraversedNode } from '@daxserver/validation-schema-codegen/traverse/types'
import { generateQualifiedNodeName } from '@daxserver/validation-schema-codegen/utils/generate-qualified-name'
import { topologicalSort } from 'graphology-dag'
import { ImportDeclaration, InterfaceDeclaration, Node, SourceFile, TypeAliasDeclaration, TypeReferenceNode } from 'ts-morph'

/**
 * Dependency traversal class for AST traversal, dependency collection, and analysis
 * Uses separate graphs for files and nodes for better separation of concerns
 */
export class DependencyTraversal {
  private fileGraph = new FileGraph()
  private nodeGraph = new NodeGraph()

  constructor() {}

  /**
   * Start the traversal process from the main source file
   * This method handles the complete recursive traversal and returns sorted nodes
   */
  startTraversal(mainSourceFile: SourceFile): TraversedNode[] {
    // Mark main source file nodes as main code
    this.addLocalTypes(mainSourceFile, true)

    // Start recursive traversal from imports
    const importDeclarations = mainSourceFile.getImportDeclarations()
    this.collectFromImports(importDeclarations, true, mainSourceFile)

    // Extract dependencies for all nodes
    this.extractDependencies()

    // Return topologically sorted nodes
    return this.getNodesToPrint()
  }

  /**
   * Add local types from a source file to the node graph
   */
  addLocalTypes(sourceFile: SourceFile, isMainCode: boolean = false): void {
    const typeAliases = sourceFile.getTypeAliases()
    const interfaces = sourceFile.getInterfaces()
    const enums = sourceFile.getEnums()
    const functions = sourceFile.getFunctions()

    // First pass: Add all nodes to the graph without extracting dependencies

    // Collect type aliases
    for (const typeAlias of typeAliases) {
      const typeName = typeAlias.getName()
      const qualifiedName = generateQualifiedNodeName(typeName, typeAlias.getSourceFile())
      this.nodeGraph.addTypeNode(qualifiedName, {
        node: typeAlias,
        type: 'typeAlias',
        originalName: typeName,
        qualifiedName,
        isImported: false,
        isMainCode,
      })
    }

    // Collect interfaces
    for (const interfaceDecl of interfaces) {
      const interfaceName = interfaceDecl.getName()
      const qualifiedName = generateQualifiedNodeName(interfaceName, interfaceDecl.getSourceFile())
      this.nodeGraph.addTypeNode(qualifiedName, {
        node: interfaceDecl,
        type: 'interface',
        originalName: interfaceName,
        qualifiedName,
        isImported: false,
        isMainCode,
      })
    }

    // Collect enums
    for (const enumDecl of enums) {
      const enumName = enumDecl.getName()
      const qualifiedName = generateQualifiedNodeName(enumName, enumDecl.getSourceFile())
      this.nodeGraph.addTypeNode(qualifiedName, {
        node: enumDecl,
        type: 'enum',
        originalName: enumName,
        qualifiedName,
        isImported: false,
        isMainCode,
      })
    }

    // Collect functions
    for (const functionDecl of functions) {
      const functionName = functionDecl.getName()
      if (!functionName) continue

      const qualifiedName = generateQualifiedNodeName(functionName, functionDecl.getSourceFile())
      this.nodeGraph.addTypeNode(qualifiedName, {
        node: functionDecl,
        type: 'function',
        originalName: functionName,
        qualifiedName,
        isImported: false,
        isMainCode,
      })
    }

  }

  /**
   * Extract dependencies for all nodes in the graph
   */
  extractDependencies(): void {
    // Extract dependencies for all nodes in the graph
    for (const nodeId of this.nodeGraph.nodes()) {
      const nodeData = this.nodeGraph.getNode(nodeId)

      if (nodeData.type === 'typeAlias') {
         const typeAlias = nodeData.node as TypeAliasDeclaration
         const typeNode = typeAlias.getTypeNode()
         if (!typeNode) continue

         const typeReferences = this.extractTypeReferences(typeNode)

         // Add edges for dependencies
         for (const referencedType of typeReferences) {
           if (this.nodeGraph.hasNode(referencedType)) {
             this.nodeGraph.addDependency(referencedType, nodeId)
           }
         }
       } else if (nodeData.type === 'interface') {
         const interfaceDecl = nodeData.node as InterfaceDeclaration
         const typeReferences = this.extractTypeReferences(interfaceDecl)

         // Add edges for dependencies
         for (const referencedType of typeReferences) {
           if (this.nodeGraph.hasNode(referencedType)) {
             this.nodeGraph.addDependency(referencedType, nodeId)
           }
         }
       }
    }
  }


  /**
   * Check if a type is used in the source file
   */
  private isTypeUsedInSourceFile(typeName: string, sourceFile: SourceFile): boolean {
    const typeReferences: string[] = []

    sourceFile.forEachDescendant((node) => {
      if (Node.isTypeReference(node)) {
        const typeRefNode = node as TypeReferenceNode
        const referencedTypeName = typeRefNode.getTypeName().getText()
        typeReferences.push(referencedTypeName)
      }
    })

    return typeReferences.includes(typeName)
  }

  /**
   * Collect dependencies from import declarations
   */
  collectFromImports(importDeclarations: ImportDeclaration[], isDirectImport: boolean = true, mainSourceFile?: SourceFile): void {
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
        const isRootImport = isDirectImport
        this.nodeGraph.addTypeNode(qualifiedName, {
          node: typeAlias,
          type: 'typeAlias',
          originalName: typeName,
          qualifiedName,
          isImported: true,
          isDirectImport,
          isRootImport,
        })
      }

      for (const interfaceDecl of interfaces) {
        const interfaceName = interfaceDecl.getName()
        const qualifiedName = generateQualifiedNodeName(interfaceName, interfaceDecl.getSourceFile())
        const isRootImport = isDirectImport
        this.nodeGraph.addTypeNode(qualifiedName, {
          node: interfaceDecl,
          type: 'interface',
          originalName: interfaceName,
          qualifiedName,
          isImported: true,
          isDirectImport,
          isRootImport,
        })
      }

      for (const enumDecl of enums) {
        const enumName = enumDecl.getName()
        const qualifiedName = generateQualifiedNodeName(enumName, enumDecl.getSourceFile())
        const isRootImport = isDirectImport
        this.nodeGraph.addTypeNode(qualifiedName, {
          node: enumDecl,
          type: 'enum',
          originalName: enumName,
          qualifiedName,
          isImported: true,
          isDirectImport,
          isRootImport,
        })
      }

      for (const functionDecl of functions) {
        const functionName = functionDecl.getName()
        if (!functionName) continue

        const qualifiedName = generateQualifiedNodeName(functionName, functionDecl.getSourceFile())
        const isRootImport = isDirectImport
        this.nodeGraph.addTypeNode(qualifiedName, {
          node: functionDecl,
          type: 'function',
          originalName: functionName,
          qualifiedName,
          isImported: true,
          isDirectImport,
          isRootImport,
        })
      }

      // Recursively collect from nested imports (mark as transitive)
      this.collectFromImports(imports, false, mainSourceFile)
    }
  }

  /**
   * Get nodes in dependency order (dependencies first)
   * Retrieved from the graph, not from SourceFile
   */
  getNodesToPrint(): TraversedNode[] {
    try {
      // Use topological sort to ensure dependencies are printed first
      const sortedNodeIds = topologicalSort(this.nodeGraph)
      return sortedNodeIds.map((nodeId: string) =>
        this.nodeGraph.getNodeAttributes(nodeId),
      )
    } catch {
      // Handle circular dependencies by returning nodes in insertion order
      // This ensures dependencies are still processed before dependents when possible
      return Array.from(this.nodeGraph.nodes()).map((nodeId: string) =>
        this.nodeGraph.getNodeAttributes(nodeId),
      )
    }
  }



  private extractTypeReferences(typeNode: Node): string[] {
    const references: string[] = []
    const visited = new Set<Node>()

    const traverse = (node: Node): void => {
      if (visited.has(node)) return
      visited.add(node)

      if (Node.isTypeReference(node)) {
        const typeRefNode = node as TypeReferenceNode
        const typeName = typeRefNode.getTypeName().getText()

        for (const qualifiedName of this.nodeGraph.nodes()) {
          const nodeData = this.nodeGraph.getNode(qualifiedName)
          if (nodeData.originalName === typeName) {
            references.push(qualifiedName)
            break
          }
        }

        return
      }

      node.forEachChild(traverse)
    }

    traverse(typeNode)

    return references
  }
}
