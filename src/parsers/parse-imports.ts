import type { ImportDeclaration, TypeAliasDeclaration } from 'ts-morph'
import { TypeAliasParser } from './parse-type-aliases'
import { BaseParser, type BaseParserOptions } from './base-parser'

export interface ImportParserOptions extends BaseParserOptions {
  typeAliasParser: TypeAliasParser
}

export class ImportParser extends BaseParser {
  private typeAliasParser: TypeAliasParser
  private visitedFiles = new Set<string>()
  private fileCache = new Map<
    string,
    { typeAliases: TypeAliasDeclaration[]; imports: ImportDeclaration[] }
  >()

  constructor(options: ImportParserOptions) {
    super(options)
    this.typeAliasParser = options.typeAliasParser
  }

  parse(importDeclaration: ImportDeclaration): void {
    const importedSourceFile = importDeclaration.getModuleSpecifierSourceFile()
    if (!importedSourceFile) return

    const filePath = importedSourceFile.getFilePath()

    // Prevent infinite recursion and duplicate processing
    if (this.visitedFiles.has(filePath)) return
    this.visitedFiles.add(filePath)

    // Use cached file data if available
    let fileData = this.fileCache.get(filePath)
    if (!fileData) {
      fileData = {
        typeAliases: importedSourceFile.getTypeAliases(),
        imports: importedSourceFile.getImportDeclarations(),
      }
      this.fileCache.set(filePath, fileData)
    }

    // Process nested imports first (depth-first)
    for (const nestedImport of fileData.imports) {
      this.parse(nestedImport)
    }

    // Then process type aliases from this file
    for (const typeAlias of fileData.typeAliases) {
      this.typeAliasParser.parse(typeAlias)
    }
  }

  reset(): void {
    this.visitedFiles.clear()
    this.fileCache.clear()
  }
}
