import { extractDependencies } from '@daxserver/validation-schema-codegen/traverse/dependency-extractor'
import { FileGraph } from '@daxserver/validation-schema-codegen/traverse/file-graph'
import { ImportCollector } from '@daxserver/validation-schema-codegen/traverse/import-collector'
import { addLocalTypes } from '@daxserver/validation-schema-codegen/traverse/local-type-collector'
import { NodeGraph } from '@daxserver/validation-schema-codegen/traverse/node-graph'
import type { TraversedNode } from '@daxserver/validation-schema-codegen/traverse/types'
import {
  GraphVisualizer,
  type VisualizationOptions,
} from '@daxserver/validation-schema-codegen/utils/graph-visualizer'
import { resolverStore } from '@daxserver/validation-schema-codegen/utils/resolver-store'
import { hasCycle, topologicalSort } from 'graphology-dag'
import { SourceFile } from 'ts-morph'

export class DependencyTraversal {
  private fileGraph = new FileGraph()
  private nodeGraph = new NodeGraph()
  private maincodeNodeIds = new Set<string>()
  private requiredNodeIds = new Set<string>()
  private importCollector = new ImportCollector(
    this.fileGraph,
    this.nodeGraph,
    this.maincodeNodeIds,
    this.requiredNodeIds,
  )

  startTraversal(sourceFile: SourceFile): TraversedNode[] {
    // Mark main source file nodes as main code
    addLocalTypes(sourceFile, this.nodeGraph, this.maincodeNodeIds, this.requiredNodeIds)

    // Start recursive traversal from imports
    const importDeclarations = sourceFile.getImportDeclarations()
    this.importCollector.collectFromImports(importDeclarations)

    // Extract dependencies for all nodes
    extractDependencies(this.nodeGraph, this.requiredNodeIds)

    // Return topologically sorted required nodes
    return this.getNodesToPrint()
  }

  /**
   * Get nodes in dependency order from graph
   * Handles circular dependencies gracefully by falling back to simple node order
   */
  getNodesToPrint(): TraversedNode[] {
    // Get all qualified names from resolver store, then apply topological ordering
    const allQualifiedNames = resolverStore.getAllQualifiedNames()

    // Filter to only required nodes that exist in both resolver store and node graph
    const requiredQualifiedNames = allQualifiedNames.filter((qualifiedName: string) =>
      this.requiredNodeIds.has(qualifiedName),
    )

    // Apply topological ordering only to the required nodes
    const orderedNodes = hasCycle(this.nodeGraph)
      ? requiredQualifiedNames
      : topologicalSort(this.nodeGraph).filter((nodeId: string) =>
          requiredQualifiedNames.includes(nodeId),
        )

    // Map to actual node data
    const filteredNodes = orderedNodes
      .map((nodeId: string) => this.nodeGraph.getNode(nodeId))
      .filter((node): node is TraversedNode => node !== null)

    return filteredNodes
  }

  async visualizeGraph(options: VisualizationOptions = {}): Promise<string> {
    return GraphVisualizer.generateVisualization(this.nodeGraph, options)
  }

  getNodeGraph(): NodeGraph {
    return this.nodeGraph
  }
}
