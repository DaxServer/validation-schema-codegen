import { ChunkParser } from '@daxserver/validation-schema-codegen/parsers/parse-chunks'
import { EnumParser } from '@daxserver/validation-schema-codegen/parsers/parse-enums'
import { FunctionDeclarationParser } from '@daxserver/validation-schema-codegen/parsers/parse-function-declarations'
import { InterfaceParser } from '@daxserver/validation-schema-codegen/parsers/parse-interfaces'
import { TypeAliasParser } from '@daxserver/validation-schema-codegen/parsers/parse-type-aliases'
import type { TraversedNode } from '@daxserver/validation-schema-codegen/traverse/types'
import { Node, SourceFile, ts } from 'ts-morph'

import { NodeGraph } from '@daxserver/validation-schema-codegen/traverse/node-graph'

export interface PrinterOptions {
  newSourceFile: SourceFile
  printer: ts.Printer
  nodeGraph: NodeGraph
}

export class TypeBoxPrinter {
  private readonly newSourceFile: SourceFile
  private readonly printer: ts.Printer
  private readonly nodeGraph: NodeGraph
  private readonly processedTypes = new Set<string>()
  private readonly typeAliasParser: TypeAliasParser
  private readonly interfaceParser: InterfaceParser
  private readonly enumParser: EnumParser
  private readonly functionParser: FunctionDeclarationParser
  private readonly chunkParser: ChunkParser

  constructor(options: PrinterOptions) {
    this.newSourceFile = options.newSourceFile
    this.printer = options.printer
    this.nodeGraph = options.nodeGraph

    // Initialize parsers with the same configuration
    const parserOptions = {
      newSourceFile: this.newSourceFile,
      printer: this.printer,
      processedTypes: this.processedTypes,
      nodeGraph: this.nodeGraph,
    }

    this.typeAliasParser = new TypeAliasParser(parserOptions)
    this.interfaceParser = new InterfaceParser(parserOptions)
    this.enumParser = new EnumParser(parserOptions)
    this.functionParser = new FunctionDeclarationParser(parserOptions)
    this.chunkParser = new ChunkParser(parserOptions)
  }

  printNode(traversedNode: TraversedNode): void {
    const { node, aliasName, type } = traversedNode

    // Handle chunk nodes first
    if (type === 'chunk') {
      this.chunkParser.parseChunk(traversedNode, aliasName)
      return
    }

    // Handle type aliases with chunk references using chunk parser
    if (
      type === 'typeAlias' &&
      traversedNode.chunkReferences &&
      traversedNode.chunkReferences.length > 0
    ) {
      this.chunkParser.parseChunk(traversedNode, aliasName)
      return
    }

    switch (true) {
      case Node.isTypeAliasDeclaration(node):
        this.typeAliasParser.parse(node, aliasName)
        break

      case Node.isInterfaceDeclaration(node):
        this.interfaceParser.parse(node, aliasName)
        break

      case Node.isEnumDeclaration(node):
        this.enumParser.parse(node, aliasName)
        break

      case Node.isFunctionDeclaration(node):
        this.functionParser.parse(node, aliasName)
        break

      default:
    }
  }
}
