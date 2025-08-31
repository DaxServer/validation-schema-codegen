import { DirectedGraph } from 'graphology'
import type { SourceFile } from 'ts-morph'

type FileNodeAttributes = {
  type: 'file'
  sourceFile: SourceFile
}

/**
 * Graph for managing file dependencies
 * Tracks relationships between source files
 */
export class FileGraph extends DirectedGraph<FileNodeAttributes> {
  /**
   * Add a file to the graph
   */
  addFile(filePath: string, sourceFile: SourceFile): void {
    if (!this.hasNode(filePath)) {
      this.addNode(filePath, {
        type: 'file',
        sourceFile,
      })
    }
  }
}
