import type { ImportDeclaration, SourceFile, TypeAliasDeclaration } from 'ts-morph'

export interface FileResolver {
  getModuleSpecifierSourceFile(importDeclaration: ImportDeclaration): SourceFile | undefined
  getFilePath(sourceFile: SourceFile): string
  getImportDeclarations(sourceFile: SourceFile): ImportDeclaration[]
  getTypeAliases(sourceFile: SourceFile): TypeAliasDeclaration[]
}

export class DefaultFileResolver implements FileResolver {
  getModuleSpecifierSourceFile(importDeclaration: ImportDeclaration): SourceFile | undefined {
    return importDeclaration.getModuleSpecifierSourceFile()
  }

  getFilePath(sourceFile: SourceFile): string {
    return sourceFile.getFilePath()
  }

  getImportDeclarations(sourceFile: SourceFile): ImportDeclaration[] {
    return sourceFile.getImportDeclarations()
  }

  getTypeAliases(sourceFile: SourceFile): TypeAliasDeclaration[] {
    return sourceFile.getTypeAliases()
  }
}
