import { ExportGetableNode, Node, SourceFile, ts } from 'ts-morph'

export interface BaseParserOptions {
  newSourceFile: SourceFile
  printer: ts.Printer
  processedTypes: Set<string>
  exportEverything?: boolean
}

export abstract class BaseParser {
  protected newSourceFile: SourceFile
  protected printer: ts.Printer
  protected processedTypes: Set<string>
  protected exportEverything: boolean

  constructor(options: BaseParserOptions) {
    this.newSourceFile = options.newSourceFile
    this.printer = options.printer
    this.processedTypes = options.processedTypes
    this.exportEverything = options.exportEverything ?? false
  }

  protected getIsExported(node: ExportGetableNode, isImported: boolean = false): boolean {
    if (this.exportEverything) {
      return true
    }
    return isImported ? false : node.hasExportKeyword()
  }

  abstract parse(node: Node): void
}
