import { DirectedGraph } from 'graphology'
import type { SourceFile } from 'ts-morph'

/**
 * Graph for managing file dependencies
 * Tracks relationships between source files
 */
export class FileGraph extends DirectedGraph {
  /**
   * Add a file to the graph
   */
  addFile(filePath: string, sourceFile: SourceFile): void {
    if (this.hasNode(filePath)) return

    this.addNode(filePath, {
      type: 'file',
      sourceFile,
    })
  }
}
