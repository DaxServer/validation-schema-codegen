import type { TraversedNode } from '@daxserver/validation-schema-codegen/traverse/types'
import { DirectedGraph } from 'graphology'

/**
 * Graph for managing type node dependencies
 * Tracks relationships between type nodes (interfaces, type aliases, enums, functions)
 */
export class NodeGraph extends DirectedGraph<TraversedNode> {
  /**
   * Add a type node to the graph
   */
  addTypeNode(qualifiedName: string, node: TraversedNode): void {
    if (this.hasNode(qualifiedName)) return

    this.addNode(qualifiedName, node)
  }

  /**
   * Get node by qualified name
   */
  getNode(qualifiedName: string): TraversedNode {
    return this.getNodeAttributes(qualifiedName) as TraversedNode
  }

  /**
   * Remove unused imported nodes that have no outgoing edges
   * Never removes root imports (types directly imported from the main file)
   */
  removeUnusedImportedNodes(): void {
    const nodesToRemove: string[] = []

    for (const nodeId of this.nodes()) {
      const nodeData = this.getNodeAttributes(nodeId)
      if (nodeData?.isImported && !nodeData?.isMainCode) {
        // Check if this imported type has any outgoing edges (other nodes depend on it)
        const outgoingEdges = this.outboundNeighbors(nodeId)
        if (outgoingEdges.length === 0) {
          nodesToRemove.push(nodeId)
        }
      }
    }

    // Remove unused imported types
    for (const nodeId of nodesToRemove) {
      this.dropNode(nodeId)
    }
  }

  /**
   * Add dependency edge between two nodes
   */
  addDependency(fromNode: string, toNode: string): void {
    if (this.hasNode(fromNode) && this.hasNode(toNode)) {
      this.addDirectedEdge(fromNode, toNode)
    }
  }
}
