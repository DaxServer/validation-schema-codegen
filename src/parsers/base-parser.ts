import { Node, SourceFile, ts } from 'ts-morph'

export interface BaseParserOptions {
  newSourceFile: SourceFile
  printer: ts.Printer
  processedTypes: Set<string>
}

export abstract class BaseParser {
  protected newSourceFile: SourceFile
  protected printer: ts.Printer
  protected processedTypes: Set<string>

  constructor(options: BaseParserOptions) {
    this.newSourceFile = options.newSourceFile
    this.printer = options.printer
    this.processedTypes = options.processedTypes
  }

  abstract parse(node: Node): void
}
