import { EnumParser } from '@daxserver/validation-schema-codegen/parsers/parse-enums'
import { FunctionDeclarationParser } from '@daxserver/validation-schema-codegen/parsers/parse-function-declarations'
import { InterfaceParser } from '@daxserver/validation-schema-codegen/parsers/parse-interfaces'
import { TypeAliasParser } from '@daxserver/validation-schema-codegen/parsers/parse-type-aliases'
import { Node, SourceFile, ts } from 'ts-morph'

export interface PrinterOptions {
  newSourceFile: SourceFile
  printer: ts.Printer
}

export class TypeBoxPrinter {
  private readonly newSourceFile: SourceFile
  private readonly printer: ts.Printer
  private readonly processedTypes = new Set<string>()
  private readonly typeAliasParser: TypeAliasParser
  private readonly interfaceParser: InterfaceParser
  private readonly enumParser: EnumParser
  private readonly functionParser: FunctionDeclarationParser

  constructor(options: PrinterOptions) {
    this.newSourceFile = options.newSourceFile
    this.printer = options.printer

    // Initialize parsers with the same configuration
    const parserOptions = {
      newSourceFile: this.newSourceFile,
      printer: this.printer,
      processedTypes: this.processedTypes,
    }

    this.typeAliasParser = new TypeAliasParser(parserOptions)
    this.interfaceParser = new InterfaceParser(parserOptions)
    this.enumParser = new EnumParser(parserOptions)
    this.functionParser = new FunctionDeclarationParser(parserOptions)
  }

  printNode(traversedNode: { node: Node; isImported?: boolean }): void {
    const { node } = traversedNode

    switch (true) {
      case Node.isTypeAliasDeclaration(node):
        this.typeAliasParser.parseWithImportFlag(node)
        break

      case Node.isInterfaceDeclaration(node):
        this.interfaceParser.parse(node)
        break

      case Node.isEnumDeclaration(node):
        this.enumParser.parse(node)
        break

      case Node.isFunctionDeclaration(node):
        this.functionParser.parse(node)
        break

      default:
    }
  }
}
