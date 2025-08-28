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
   * Add dependency edge between two nodes
   */
  addDependency(fromNode: string, toNode: string): void {
    if (
      !this.hasNode(fromNode) ||
      !this.hasNode(toNode) ||
      this.hasDirectedEdge(fromNode, toNode)
    ) {
      return
    }

    this.addDirectedEdge(fromNode, toNode)
  }
}
