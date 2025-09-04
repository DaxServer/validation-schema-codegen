import { NodeGraph } from '@daxserver/validation-schema-codegen/traverse/node-graph'
import { Node, SourceFile, ts } from 'ts-morph'

export interface BaseParserOptions {
  newSourceFile: SourceFile
  printer: ts.Printer
  processedTypes: Set<string>
  nodeGraph: NodeGraph
}

export abstract class BaseParser {
  protected newSourceFile: SourceFile
  protected printer: ts.Printer
  protected processedTypes: Set<string>
  protected nodeGraph: NodeGraph

  constructor(options: BaseParserOptions) {
    this.newSourceFile = options.newSourceFile
    this.printer = options.printer
    this.processedTypes = options.processedTypes
    this.nodeGraph = options.nodeGraph
  }

  abstract parse(node: Node): void
}
