import type { TraversedNode } from '@daxserver/validation-schema-codegen/traverse/types'
import { DirectedGraph } from 'graphology'

export class DependencyGraph extends DirectedGraph {
  add(name: string, node: TraversedNode) {
    this.addNode(name, node)
  }
}
