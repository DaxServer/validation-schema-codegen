import {
  BaseParser,
  type BaseParserOptions,
} from '@daxserver/validation-schema-codegen/parsers/base-parser'
import type { TraversedNode } from '@daxserver/validation-schema-codegen/traverse/types'
import { GenericTypeUtils } from '@daxserver/validation-schema-codegen/utils/generic-type-utils'
import { getTypeBoxType } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { SourceFile, ts } from 'ts-morph'

export interface ChunkParserOptions extends BaseParserOptions {
  newSourceFile: SourceFile
  printer: ts.Printer
  processedTypes: Set<string>
}

export class ChunkParser extends BaseParser {
  constructor(options: ChunkParserOptions) {
    super(options)
  }

  parse(): void {
    // This method is required by BaseParser but not used for chunk parsing
    throw new Error('Use parseChunk(traversedNode, aliasName) instead')
  }

  parseChunk(traversedNode: TraversedNode, aliasName?: string): void {
    const typeName = aliasName || traversedNode.originalName

    if (this.processedTypes.has(typeName)) return
    this.processedTypes.add(typeName)

    this.parseChunkNode(traversedNode, typeName)
  }

  private parseChunkNode(traversedNode: TraversedNode, typeName: string): void {
    // If this is an individual chunk node (type === 'chunk'), process it as a regular union
    if (traversedNode.type === 'chunk') {
      const typeboxType = this.printer.printNode(
        ts.EmitHint.Expression,
        getTypeBoxType(traversedNode.node, { nodeGraph: this.nodeGraph }),
        this.newSourceFile.compilerNode,
      )

      // Chunk nodes should only be const variables, not exported and without static type aliases
      GenericTypeUtils.addTypeBoxVariableStatement(this.newSourceFile, typeName, typeboxType, false)

      return
    }

    // If this is a main type with chunk references, create union of chunk identifiers
    if (!traversedNode.chunkReferences || traversedNode.chunkReferences.length === 0) {
      // Fallback to empty union if no chunk references
      const unionCall = GenericTypeUtils.makeTypeCall('Union', [])
      const typeboxType = this.printer.printNode(
        ts.EmitHint.Expression,
        unionCall,
        this.newSourceFile.compilerNode,
      )

      GenericTypeUtils.addTypeBoxVariableStatement(this.newSourceFile, typeName, typeboxType)
      GenericTypeUtils.addStaticTypeAlias(
        this.newSourceFile,
        typeName,
        this.newSourceFile.compilerNode,
        this.printer,
      )

      return
    }

    // Convert chunk references to identifier references
    const chunkIdentifiers = traversedNode.chunkReferences.map((qualifiedName) => {
      const chunkNode = this.nodeGraph.getNode(qualifiedName)
      if (!chunkNode) {
        throw new Error(`Chunk node not found: ${qualifiedName}`)
      }
      // Use the original name of the chunk as an identifier
      return ts.factory.createIdentifier(chunkNode.originalName)
    })
    const arrayLiteral = ts.factory.createArrayLiteralExpression(chunkIdentifiers)
    const unionCall = GenericTypeUtils.makeTypeCall('Union', [arrayLiteral])

    const typeboxType = this.printer.printNode(
      ts.EmitHint.Expression,
      unionCall,
      this.newSourceFile.compilerNode,
    )

    GenericTypeUtils.addTypeBoxVariableStatement(this.newSourceFile, typeName, typeboxType)
    GenericTypeUtils.addStaticTypeAlias(
      this.newSourceFile,
      typeName,
      this.newSourceFile.compilerNode,
      this.printer,
    )
  }
}
