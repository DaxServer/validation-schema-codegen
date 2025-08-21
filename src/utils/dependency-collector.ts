import {
  DefaultFileResolver,
  type FileResolver,
} from '@daxserver/validation-schema-codegen/utils/dependency-file-resolver'
import {
  DefaultTypeReferenceExtractor,
  type TypeReferenceExtractor,
} from '@daxserver/validation-schema-codegen/utils/dependency-type'
import { ImportDeclaration, SourceFile, TypeAliasDeclaration } from 'ts-morph'

export interface TypeDependency {
  typeAlias: TypeAliasDeclaration
  sourceFile: SourceFile
  isImported: boolean
}

export class DependencyCollector {
  private dependencies = new Map<string, TypeDependency>()
  private visited = new Set<string>()
  private visitedFiles = new Set<string>()
  private static fileCache = new Map<
    string,
    { imports: ImportDeclaration[]; types: TypeAliasDeclaration[] }
  >()
  private fileResolver: FileResolver
  private typeReferenceExtractor: TypeReferenceExtractor

  constructor(
    fileResolver = new DefaultFileResolver(),
    typeReferenceExtractor = new DefaultTypeReferenceExtractor(),
  ) {
    this.fileResolver = fileResolver
    this.typeReferenceExtractor = typeReferenceExtractor
  }

  getDependencies(): Map<string, TypeDependency> {
    return new Map(this.dependencies)
  }

  getVisitedFiles(): Set<string> {
    return new Set(this.visitedFiles)
  }

  collectFromImports(
    importDeclarations: ImportDeclaration[],
    exportEverything = true,
  ): TypeDependency[] {
    importDeclarations.forEach((importDeclaration) => {
      this.collectFromImport(importDeclaration)
    })

    if (!exportEverything) {
      this.filterUnusedImports()
    }

    return this.topologicalSort()
  }

  private collectFromImport(importDeclaration: ImportDeclaration): void {
    const importedSourceFile = this.fileResolver.getModuleSpecifierSourceFile(importDeclaration)
    if (!importedSourceFile) return

    const filePath = this.fileResolver.getFilePath(importedSourceFile)
    if (this.visitedFiles.has(filePath)) return
    this.visitedFiles.add(filePath)

    // Check cache for file data
    let fileData = DependencyCollector.fileCache.get(filePath)

    if (!fileData) {
      fileData = {
        imports: this.fileResolver.getImportDeclarations(importedSourceFile),
        types: this.fileResolver.getTypeAliases(importedSourceFile),
      }
      DependencyCollector.fileCache.set(filePath, fileData)
    }

    // First collect all imports from this file
    for (const nestedImport of fileData.imports) {
      this.collectFromImport(nestedImport)
    }

    // Then collect type aliases from this file - optimized batch processing
    const newTypes = new Map<string, TypeDependency>()

    for (const typeAlias of fileData.types) {
      const typeName = typeAlias.getName()

      if (!this.dependencies.has(typeName)) {
        newTypes.set(typeName, {
          typeAlias,
          sourceFile: importedSourceFile,
          isImported: true,
        })
      }
    }

    // Batch add new types to avoid repeated Map operations
    for (const [typeName, dependency] of newTypes) {
      this.dependencies.set(typeName, dependency)
    }
  }

  addLocalTypes(typeAliases: TypeAliasDeclaration[], sourceFile: SourceFile): void {
    // Batch process local types for better performance
    const newDependencies = new Map<string, TypeDependency>()

    for (const typeAlias of typeAliases) {
      const typeName = typeAlias.getName()

      if (!this.dependencies.has(typeName)) {
        newDependencies.set(typeName, {
          typeAlias,
          sourceFile,
          isImported: false,
        })
      }
    }

    // Batch add new dependencies
    for (const [typeName, dependency] of newDependencies) {
      this.dependencies.set(typeName, dependency)
    }
  }

  private filterUnusedImports(): void {
    const usedTypes = new Set<string>()

    // Recursively find all types referenced by local types and their dependencies
    const findUsedTypes = (typeName: string): void => {
      if (usedTypes.has(typeName)) return

      const dependency = this.dependencies.get(typeName)
      if (!dependency) return

      usedTypes.add(typeName)

      const typeNode = dependency.typeAlias.getTypeNode()
      if (typeNode) {
        const referencedTypes = this.typeReferenceExtractor.extractTypeReferences(
          typeNode,
          this.dependencies,
        )
        for (const referencedType of referencedTypes) {
          findUsedTypes(referencedType)
        }
      }
    }

    // Start from local types (non-imported) and find all their dependencies
    for (const dependency of this.dependencies.values()) {
      if (!dependency.isImported) {
        findUsedTypes(dependency.typeAlias.getName())
      }
    }

    // Remove unused imported types
    for (const [typeName, dependency] of this.dependencies.entries()) {
      if (dependency.isImported && !usedTypes.has(typeName)) {
        this.dependencies.delete(typeName)
      }
    }
  }

  private topologicalSort(): TypeDependency[] {
    const result: TypeDependency[] = []
    const visiting = new Set<string>()
    const dependencyKeys = new Set(this.dependencies.keys())

    const visit = (typeName: string): void => {
      if (this.visited.has(typeName) || visiting.has(typeName)) return

      visiting.add(typeName)
      const dependency = this.dependencies.get(typeName)
      if (!dependency) return

      // Find dependencies of this type by analyzing its type node
      const typeNode = dependency.typeAlias.getTypeNode()
      if (typeNode) {
        const referencedTypes = this.typeReferenceExtractor.extractTypeReferences(
          typeNode,
          this.dependencies,
        )

        // Use Set for O(1) lookup instead of Map.has() for each reference
        for (const referencedType of referencedTypes) {
          if (dependencyKeys.has(referencedType)) {
            visit(referencedType)
          }
        }
      }

      visiting.delete(typeName)
      this.visited.add(typeName)
      result.push(dependency)
    }

    // Visit all dependencies - use for...of for better performance
    for (const dependency of this.dependencies.values()) {
      visit(dependency.typeAlias.getName())
    }

    return result
  }

  static clearGlobalCache(): void {
    DependencyCollector.fileCache.clear()
  }
}
