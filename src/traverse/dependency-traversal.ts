import { FileGraph } from '@daxserver/validation-schema-codegen/traverse/file-graph'
import { NodeGraph } from '@daxserver/validation-schema-codegen/traverse/node-graph'
import type { TraversedNode } from '@daxserver/validation-schema-codegen/traverse/types'
import { generateQualifiedNodeName } from '@daxserver/validation-schema-codegen/utils/generate-qualified-name'
import {
  GraphVisualizer,
  type VisualizationOptions,
} from '@daxserver/validation-schema-codegen/utils/graph-visualizer'
import { hasCycle, topologicalSort } from 'graphology-dag'
import {
  EnumDeclaration,
  FunctionDeclaration,
  ImportDeclaration,
  InterfaceDeclaration,
  Node,
  SourceFile,
  SyntaxKind,
  TypeAliasDeclaration,
} from 'ts-morph'

/**
 * Dependency traversal class for AST traversal, dependency collection, and analysis
 * Uses separate graphs for files and nodes for better separation of concerns
 */
export class DependencyTraversal {
  private fileGraph = new FileGraph()
  private nodeGraph = new NodeGraph()

  /**
   * Start the traversal process from the main source file
   * This method handles the complete recursive traversal and returns sorted nodes
   */
  startTraversal(mainSourceFile: SourceFile): TraversedNode[] {
    // Mark main source file nodes as main code
    this.addLocalTypes(mainSourceFile, true)

    // Start recursive traversal from imports
    const importDeclarations = mainSourceFile.getImportDeclarations()
    this.collectFromImports(importDeclarations, true)

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
    for (const nodeId of this.nodeGraph.nodes()) {
      const nodeData = this.nodeGraph.getNode(nodeId)

      let nodeToAnalyze: Node | undefined

      if (nodeData.type === 'typeAlias') {
        const typeAlias = nodeData.node as TypeAliasDeclaration
        nodeToAnalyze = typeAlias.getTypeNode()
      } else if (nodeData.type === 'interface') {
        nodeToAnalyze = nodeData.node as InterfaceDeclaration
      } else if (nodeData.type === 'enum') {
        nodeToAnalyze = nodeData.node as EnumDeclaration
      } else if (nodeData.type === 'function') {
        nodeToAnalyze = nodeData.node as FunctionDeclaration
      }

      if (!nodeToAnalyze) continue

      const typeReferences = this.extractTypeReferences(nodeToAnalyze)

      for (const referencedType of typeReferences) {
        if (this.nodeGraph.hasNode(referencedType)) {
          this.nodeGraph.addDependency(referencedType, nodeId)
        }
      }
    }
  }

  /**
   * Collect dependencies from import declarations
   */
  collectFromImports(importDeclarations: ImportDeclaration[], isMainCode: boolean): void {
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
          isMainCode,
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
          isMainCode,
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
          isMainCode,
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
          isMainCode,
        })
      }

      // Recursively collect from nested imports (mark as transitive)
      this.collectFromImports(imports, false)
    }
  }

  /**
   * Get nodes in dependency order from graph
   * Handles circular dependencies gracefully by falling back to simple node order
   */
  getNodesToPrint(): TraversedNode[] {
    const nodes = hasCycle(this.nodeGraph)
      ? Array.from(this.nodeGraph.nodes())
      : topologicalSort(this.nodeGraph)

    return nodes.map((nodeId: string) => this.nodeGraph.getNode(nodeId))
  }

  /**
   * Generate HTML visualization of the dependency graph
   */
  async visualizeGraph(options: VisualizationOptions = {}): Promise<string> {
    return GraphVisualizer.generateVisualization(this.nodeGraph, options)
  }

  /**
   * Get the node graph for debugging purposes
   */
  getNodeGraph(): NodeGraph {
    return this.nodeGraph
  }

  private extractTypeReferences(node: Node): string[] {
    const references: string[] = []
    const visited = new Set<Node>()

    const traverse = (node: Node): void => {
      if (visited.has(node)) return
      visited.add(node)

      if (Node.isTypeReference(node)) {
        const typeName = node.getTypeName().getText()

        for (const qualifiedName of this.nodeGraph.nodes()) {
          const nodeData = this.nodeGraph.getNode(qualifiedName)
          if (nodeData.originalName === typeName) {
            references.push(qualifiedName)
            break
          }
        }
      }

      // Handle typeof expressions (TypeQuery nodes)
      if (Node.isTypeQuery(node)) {
        const exprName = node.getExprName()

        if (Node.isIdentifier(exprName) || Node.isQualifiedName(exprName)) {
          const typeName = exprName.getText()

          for (const qualifiedName of this.nodeGraph.nodes()) {
            const nodeData = this.nodeGraph.getNode(qualifiedName)
            if (nodeData.originalName === typeName) {
              references.push(qualifiedName)
              break
            }
          }
        }
      }

      // Handle interface inheritance (extends clauses)
      if (Node.isInterfaceDeclaration(node)) {
        const heritageClauses = node.getHeritageClauses()

        for (const heritageClause of heritageClauses) {
          if (heritageClause.getToken() !== SyntaxKind.ExtendsKeyword) continue

          for (const typeNode of heritageClause.getTypeNodes()) {
            const typeName = typeNode.getText()

            for (const qualifiedName of this.nodeGraph.nodes()) {
              const nodeData = this.nodeGraph.getNode(qualifiedName)
              if (nodeData.originalName === typeName) {
                references.push(qualifiedName)
                break
              }
            }
          }
        }
      }

      node.forEachChild(traverse)
    }

    traverse(node)

    return references
  }
}
