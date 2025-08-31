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
import { hasCycle, topologicalSort } from 'graphology-dag'
import { SourceFile } from 'ts-morph'

export class DependencyTraversal {
  private fileGraph = new FileGraph()
  private nodeGraph = new NodeGraph()
  private maincodeNodeIds = new Set<string>()
  private requiredNodeIds = new Set<string>()
  private importCollector = new ImportCollector(this.fileGraph, this.nodeGraph)

  startTraversal(mainSourceFile: SourceFile): TraversedNode[] {
    // Mark main source file nodes as main code
    addLocalTypes(mainSourceFile, this.nodeGraph, this.maincodeNodeIds, this.requiredNodeIds)

    // Start recursive traversal from imports
    const importDeclarations = mainSourceFile.getImportDeclarations()
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
    // Get all nodes in topological order, then filter to only required ones
    const allNodesInOrder = hasCycle(this.nodeGraph)
      ? Array.from(this.nodeGraph.nodes())
      : topologicalSort(this.nodeGraph)

    const filteredNodes = allNodesInOrder
      .filter((nodeId: string) => this.requiredNodeIds.has(nodeId))
      .map((nodeId: string) => this.nodeGraph.getNode(nodeId))

    return filteredNodes
  }

  async visualizeGraph(options: VisualizationOptions = {}): Promise<string> {
    return GraphVisualizer.generateVisualization(this.nodeGraph, options)
  }

  getNodeGraph(): NodeGraph {
    return this.nodeGraph
  }
}
