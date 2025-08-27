import {
  DefaultFileResolver,
  type FileResolver,
} from '@daxserver/validation-schema-codegen/traverse/dependency-file-resolver'
import { DirectedGraph } from 'graphology'
import { topologicalSort } from 'graphology-dag'
import {
  ImportDeclaration,
  InterfaceDeclaration,
  Node,
  SourceFile,
  TypeAliasDeclaration,
  TypeReferenceNode,
} from 'ts-morph'

export interface TypeDependency {
  typeAlias: TypeAliasDeclaration
  sourceFile: SourceFile
  isImported: boolean
}

export interface TypeReferenceExtractor {
  extractTypeReferences(typeNode: Node, dependencyGraph: DirectedGraph): string[]
}

export interface ProcessingOrderResult {
  processInterfacesFirst: boolean
  typeAliasesDependingOnInterfaces: string[]
  interfacesDependingOnTypeAliases: string[]
  optimalOrder: Array<{ name: string; type: 'interface' | 'typeAlias' }>
}

/**
 * Unified dependency traversal class that combines AST traversal, dependency collection, and analysis
 * Uses Graphology for efficient graph-based dependency management
 */
export class DependencyTraversal {
  private dependencyGraph: DirectedGraph
  private fileResolver: FileResolver
  private typeReferenceExtractor: TypeReferenceExtractor

  constructor(
    fileResolver = new DefaultFileResolver(),
    typeReferenceExtractor = new DefaultTypeReferenceExtractor(),
  ) {
    this.fileResolver = fileResolver
    this.typeReferenceExtractor = typeReferenceExtractor
    this.dependencyGraph = new DirectedGraph()
  }

  /**
   * Extract interface names referenced by a type alias
   */
  extractInterfaceReferences(
    typeAlias: TypeAliasDeclaration,
    interfaces: Map<string, InterfaceDeclaration>,
  ): string[] {
    const typeNode = typeAlias.getTypeNode()
    if (!typeNode) return []

    const references: string[] = []
    const visited = new Set<Node>()

    const traverse = (node: Node): void => {
      if (visited.has(node)) return
      visited.add(node)

      if (Node.isTypeReference(node)) {
        const typeRefNode = node as TypeReferenceNode
        const typeName = typeRefNode.getTypeName().getText()

        if (interfaces.has(typeName)) {
          references.push(typeName)
        }
      }

      node.forEachChild(traverse)
    }

    traverse(typeNode)
    return references
  }

  /**
   * Extract type alias names referenced by an interface
   */
  extractTypeAliasReferences(
    interfaceDecl: InterfaceDeclaration,
    typeAliases: Map<string, TypeAliasDeclaration>,
  ): string[] {
    const references: string[] = []
    const visited = new Set<Node>()

    const traverse = (node: Node): void => {
      if (visited.has(node)) return
      visited.add(node)

      if (Node.isTypeReference(node)) {
        const typeRefNode = node as TypeReferenceNode
        const typeName = typeRefNode.getTypeName().getText()

        if (typeAliases.has(typeName)) {
          references.push(typeName)
        }
        return
      }

      node.forEachChild(traverse)
    }

    for (const typeParam of interfaceDecl.getTypeParameters()) {
      const constraint = typeParam.getConstraint()
      if (constraint) {
        traverse(constraint)
      }
    }

    for (const heritageClause of interfaceDecl.getHeritageClauses()) {
      for (const typeNode of heritageClause.getTypeNodes()) {
        traverse(typeNode)
      }
    }

    return references
  }

  /**
   * Extract type alias references from a declaration
   */
  extractTypeAliasReferencesFromDeclaration(typeAlias: TypeAliasDeclaration): string[] {
    const references: string[] = []
    const aliasName = typeAlias.getName()

    if (!this.dependencyGraph.hasNode(aliasName)) {
      this.dependencyGraph.addNode(aliasName, {
        type: 'typeAlias',
        declaration: typeAlias,
        sourceFile: typeAlias.getSourceFile(),
        isImported: false,
      })
    }

    const typeNode = typeAlias.getTypeNode()
    if (typeNode) {
      const typeReferences = this.typeReferenceExtractor.extractTypeReferences(
        typeNode,
        this.dependencyGraph,
      )
      references.push(...typeReferences)
    }

    return references
  }

  /**
   * Extract type references from a node
   */
  extractTypeReferences(typeNode: Node): string[] {
    const references: string[] = []
    const visited = new Set<Node>()

    const traverse = (node: Node): void => {
      if (visited.has(node)) return
      visited.add(node)

      if (Node.isTypeReference(node)) {
        const typeRefNode = node as TypeReferenceNode
        const typeName = typeRefNode.getTypeName().getText()

        if (this.dependencyGraph.hasNode(typeName)) {
          references.push(typeName)
        }
        return
      }

      node.forEachChild(traverse)
    }

    traverse(typeNode)

    return references
  }

  /**
   * Add local types to the dependency collection
   */
  addLocalTypes(typeAliases: TypeAliasDeclaration[], sourceFile: SourceFile): void {
    for (const typeAlias of typeAliases) {
      const typeName = typeAlias.getName()
      if (!this.dependencyGraph.hasNode(typeName)) {
        this.dependencyGraph.addNode(typeName, {
          type: 'typeAlias',
          declaration: typeAlias,
          sourceFile,
          isImported: false,
        })
      }
    }
  }

  /**
   * Collect dependencies from import declarations
   */
  collectFromImports(importDeclarations: ImportDeclaration[]): TypeDependency[] {
    const collectedDependencies: TypeDependency[] = []

    for (const importDecl of importDeclarations) {
      const moduleSourceFile = this.fileResolver.getModuleSpecifierSourceFile(importDecl)
      if (!moduleSourceFile) continue

      const filePath = this.fileResolver.getFilePath(moduleSourceFile)
      if (this.dependencyGraph.hasNode(filePath)) continue

      this.dependencyGraph.addNode(filePath, {
        type: 'file',
        sourceFile: moduleSourceFile,
      })

      const imports = this.fileResolver.getImportDeclarations(moduleSourceFile)
      const types = this.fileResolver.getTypeAliases(moduleSourceFile)

      for (const typeAlias of types) {
        const typeName = typeAlias.getName()
        if (!this.dependencyGraph.hasNode(typeName)) {
          this.dependencyGraph.addNode(typeName, {
            type: 'typeAlias',
            declaration: typeAlias,
            sourceFile: moduleSourceFile,
            isImported: true,
          })
          const dependency: TypeDependency = {
            typeAlias,
            sourceFile: moduleSourceFile,
            isImported: true,
          }
          collectedDependencies.push(dependency)
        }
      }

      const nestedDependencies = this.collectFromImports(imports)
      collectedDependencies.push(...nestedDependencies)
    }

    return collectedDependencies
  }

  /**
   * Analyze processing order for interfaces and type aliases
   */
  analyzeProcessingOrder(
    typeAliases: TypeAliasDeclaration[],
    interfaces: InterfaceDeclaration[],
  ): ProcessingOrderResult {
    this.dependencyGraph = new DirectedGraph()

    const typeAliasMap = new Map<string, TypeAliasDeclaration>()
    const interfaceMap = new Map<string, InterfaceDeclaration>()

    for (const typeAlias of typeAliases) {
      typeAliasMap.set(typeAlias.getName(), typeAlias)
      this.dependencyGraph.addNode(typeAlias.getName(), {
        type: 'typeAlias',
        declaration: typeAlias,
      })
    }

    for (const interfaceDecl of interfaces) {
      interfaceMap.set(interfaceDecl.getName(), interfaceDecl)
      this.dependencyGraph.addNode(interfaceDecl.getName(), {
        type: 'interface',
        declaration: interfaceDecl,
      })
    }

    const typeAliasesDependingOnInterfaces: string[] = []
    const interfacesDependingOnTypeAliases: string[] = []

    for (const typeAlias of typeAliases) {
      const interfaceRefs = this.extractInterfaceReferences(typeAlias, interfaceMap)
      if (interfaceRefs.length > 0) {
        typeAliasesDependingOnInterfaces.push(typeAlias.getName())
        for (const interfaceRef of interfaceRefs) {
          this.dependencyGraph.addEdge(interfaceRef, typeAlias.getName(), {
            type: 'REFERENCES',
            direct: true,
            context: 'type-dependency',
          })
        }
      }
    }

    for (const interfaceDecl of interfaces) {
      const typeAliasRefs = this.extractTypeAliasReferences(interfaceDecl, typeAliasMap)
      if (typeAliasRefs.length > 0) {
        interfacesDependingOnTypeAliases.push(interfaceDecl.getName())
        for (const typeAliasRef of typeAliasRefs) {
          this.dependencyGraph.addEdge(typeAliasRef, interfaceDecl.getName(), {
            type: 'REFERENCES',
            direct: true,
            context: 'type-dependency',
          })
        }
      }
    }

    const sortedNodes = topologicalSort(this.dependencyGraph)
    const optimalOrder = sortedNodes.map((nodeId: string) => {
      const nodeAttributes = this.dependencyGraph.getNodeAttributes(nodeId)
      const nodeType = nodeAttributes.type as 'interface' | 'typeAlias'
      return {
        name: nodeId,
        type: nodeType,
      }
    })

    const processInterfacesFirst =
      interfacesDependingOnTypeAliases.length === 0 && typeAliasesDependingOnInterfaces.length > 0

    return {
      processInterfacesFirst,
      typeAliasesDependingOnInterfaces,
      interfacesDependingOnTypeAliases,
      optimalOrder,
    }
  }

  /**
   * Filter unused imports by removing imported types that are not referenced by local types
   */
  filterUnusedImports(): void {
    const usedTypes = new Set<string>()

    // Recursively find all types referenced by local types and their dependencies
    const findUsedTypes = (typeName: string): void => {
      if (usedTypes.has(typeName)) return

      if (!this.dependencyGraph.hasNode(typeName)) return
      const nodeData = this.dependencyGraph.getNodeAttributes(typeName)
      if (!nodeData || nodeData.type !== 'typeAlias') return

      usedTypes.add(typeName)

      const typeNode = nodeData.declaration.getTypeNode()
      if (typeNode) {
        const referencedTypes = this.extractTypeReferences(typeNode)
        for (const referencedType of referencedTypes) {
          findUsedTypes(referencedType)
        }
      }
    }

    // Start from local types (non-imported) and find all their dependencies
    this.dependencyGraph.forEachNode((nodeName, nodeData) => {
      if (nodeData.type === 'typeAlias' && !nodeData.isImported) {
        findUsedTypes(nodeName)
      }
    })

    // Remove unused imported types
    const nodesToRemove: string[] = []
    this.dependencyGraph.forEachNode((nodeName, nodeData) => {
      if (nodeData.type === 'typeAlias' && nodeData.isImported && !usedTypes.has(nodeName)) {
        nodesToRemove.push(nodeName)
      }
    })
    for (const nodeName of nodesToRemove) {
      this.dependencyGraph.dropNode(nodeName)
    }
  }

  /**
   * Get topologically sorted types with preference for imported types first
   */
  getTopologicallySortedTypes(exportEverything: boolean): TypeDependency[] {
    const typeNodes = this.dependencyGraph.filterNodes(
      (_, attributes) => attributes.type === 'typeAlias',
    )
    if (typeNodes.length === 0) return []

    for (const typeName of typeNodes) {
      const nodeData = this.dependencyGraph.getNodeAttributes(typeName)
      if (!nodeData || nodeData.type !== 'typeAlias') continue

      const typeNode = nodeData.declaration.getTypeNode()
      if (typeNode) {
        const typeReferences = this.extractTypeReferences(typeNode)
        for (const ref of typeReferences) {
          if (this.dependencyGraph.hasNode(ref) && !this.dependencyGraph.hasEdge(ref, typeName)) {
            this.dependencyGraph.addEdge(ref, typeName, {
              type: 'REFERENCES',
              direct: true,
              context: 'type-dependency',
            })
          }
        }
      }
    }

    const sortedNodes = topologicalSort(this.dependencyGraph)
    const sortedDependencies = sortedNodes
      .map((nodeId: string) => {
        const nodeData = this.dependencyGraph.getNodeAttributes(nodeId)
        if (nodeData && nodeData.type === 'typeAlias') {
          return {
            typeAlias: nodeData.declaration,
            sourceFile: nodeData.sourceFile,
            isImported: nodeData.isImported,
          }
        }
        return undefined
      })
      .filter((dep): dep is TypeDependency => dep !== undefined)

    if (!exportEverything) {
      // Filter out unused imports when not exporting everything
      this.filterUnusedImports()
      // Re-get the sorted types after filtering by rebuilding the graph
      const filteredSortedNodes = topologicalSort(this.dependencyGraph)
      const filteredDependencies = filteredSortedNodes
        .map((nodeId: string) => {
          const nodeData = this.dependencyGraph.getNodeAttributes(nodeId)
          if (nodeData && nodeData.type === 'typeAlias') {
            return {
              typeAlias: nodeData.declaration,
              sourceFile: nodeData.sourceFile,
              isImported: nodeData.isImported,
            }
          }
          return undefined
        })
        .filter((dep): dep is TypeDependency => dep !== undefined)

      // For exportEverything=false, still prioritize imported types while respecting dependencies
      const processed = new Set<string>()
      const result: TypeDependency[] = []
      const remaining = [...filteredDependencies]

      while (remaining.length > 0) {
        // Find all types with satisfied dependencies
        const readyTypes = remaining.filter((dep) => this.allDependenciesProcessed(dep, processed))

        if (readyTypes.length === 0) {
          // If no types are ready, take the first one to avoid infinite loop
          const typeToAdd = remaining.shift()
          if (typeToAdd) {
            result.push(typeToAdd)
            processed.add(typeToAdd.typeAlias.getName())
          }
          continue
        }

        // Among ready types, prefer imported types first, then types with dependencies
        const importedReady = readyTypes.filter((dep) => dep.isImported)
        let typeToAdd: TypeDependency

        if (importedReady.length > 0) {
          typeToAdd = importedReady[0]!
        } else {
          // Among non-imported ready types, prefer those that have dependencies
          const withDependencies = readyTypes.filter((dep) => {
            const typeNode = dep.typeAlias.getTypeNode()
            if (!typeNode) return false
            const refs = this.extractTypeReferences(typeNode)
            return refs.length > 0
          })
          typeToAdd = withDependencies.length > 0 ? withDependencies[0]! : readyTypes[0]!
        }

        result.push(typeToAdd)
        processed.add(typeToAdd.typeAlias.getName())

        // Remove the processed type from remaining
        const index = remaining.indexOf(typeToAdd)
        if (index > -1) {
          remaining.splice(index, 1)
        }
      }

      return result
    }

    // When exportEverything is true, we want to prioritize imported types but still respect dependencies
    // Strategy: Go through the topologically sorted list and prefer imported types when there's a choice
    const result: TypeDependency[] = []
    const processed = new Set<string>()
    const remaining = [...sortedDependencies]

    while (remaining.length > 0) {
      let addedInThisRound = false

      // Find all types that can be processed (all dependencies satisfied)
      const readyTypes: { index: number; dep: TypeDependency }[] = []
      for (let i = 0; i < remaining.length; i++) {
        const dep = remaining[i]
        if (dep && this.allDependenciesProcessed(dep, processed)) {
          readyTypes.push({ index: i, dep })
        }
      }

      if (readyTypes.length > 0) {
        // Among ready types, prefer imported types first
        const importedReady = readyTypes.filter((item) => item.dep.isImported)

        let typeToAdd: { index: number; dep: TypeDependency } | undefined

        if (importedReady.length > 0) {
          // If there are imported types ready, pick the first one
          typeToAdd = importedReady[0]
        } else {
          // Among local types, prefer those that have dependencies on already processed types
          // This ensures types that depend on imported types come right after their dependencies
          const localReady = readyTypes.filter((item) => !item.dep.isImported)
          const withProcessedDeps = localReady.filter((item) => {
            const typeNode = item.dep.typeAlias.getTypeNode()
            if (!typeNode) return false
            const refs = this.extractTypeReferences(typeNode)
            return refs.some((ref) => processed.has(ref))
          })

          typeToAdd = withProcessedDeps.length > 0 ? withProcessedDeps[0] : localReady[0]
        }

        if (typeToAdd) {
          result.push(typeToAdd.dep)
          processed.add(typeToAdd.dep.typeAlias.getName())
          remaining.splice(typeToAdd.index, 1)
          addedInThisRound = true
        }
      }

      // Safety check to prevent infinite loop
      if (!addedInThisRound) {
        // Add the first remaining item to break the loop
        const dep = remaining.shift()!
        result.push(dep)
        processed.add(dep.typeAlias.getName())
      }
    }

    return result
  }

  /**
   * Check if all dependencies of a type have been processed
   */
  private allDependenciesProcessed(dependency: TypeDependency, processed: Set<string>): boolean {
    const typeNode = dependency.typeAlias.getTypeNode()
    if (!typeNode) return true

    const references = this.extractTypeReferences(typeNode)
    for (const ref of references) {
      if (!processed.has(ref)) {
        return false
      }
    }

    return true
  }

  /**
   * Get all collected dependencies
   */
  getDependencies(): Map<string, TypeDependency> {
    const dependencies = new Map<string, TypeDependency>()
    this.dependencyGraph.forEachNode((nodeName, nodeData) => {
      if (nodeData.type === 'typeAlias') {
        dependencies.set(nodeName, {
          typeAlias: nodeData.declaration,
          sourceFile: nodeData.sourceFile,
          isImported: nodeData.isImported,
        })
      }
    })

    return dependencies
  }

  /**
   * Get visited files
   */
  getVisitedFiles(): Set<string> {
    const visitedFiles = new Set<string>()
    this.dependencyGraph.forEachNode((nodeName, nodeData) => {
      if (nodeData.type === 'file') {
        visitedFiles.add(nodeName)
      }
    })

    return visitedFiles
  }

  /**
   * Get the dependency graph
   */
  getDependencyGraph(): DirectedGraph {
    return this.dependencyGraph
  }

  /**
   * Clear all caches and reset state
   */
  clearCache(): void {
    this.dependencyGraph = new DirectedGraph()
  }
}

/**
 * Default type reference extractor implementation
 */
export class DefaultTypeReferenceExtractor implements TypeReferenceExtractor {
  extractTypeReferences(typeNode: Node, dependencyGraph: DirectedGraph): string[] {
    const references: string[] = []
    const visited = new Set<Node>()

    const traverse = (node: Node): void => {
      if (visited.has(node)) return
      visited.add(node)

      if (Node.isTypeReference(node)) {
        const typeRefNode = node as TypeReferenceNode
        const typeName = typeRefNode.getTypeName().getText()

        if (dependencyGraph.hasNode(typeName)) {
          references.push(typeName)
        }
        return
      }

      node.forEachChild(traverse)
    }

    traverse(typeNode)

    return references
  }
}
