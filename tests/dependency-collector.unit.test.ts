import { DependencyCollector } from '@daxserver/validation-schema-codegen/utils/dependency-collector'
import {
  DefaultFileResolver,
  type FileResolver,
} from '@daxserver/validation-schema-codegen/utils/dependency-file-resolver'
import {
  DefaultTypeReferenceExtractor,
  type TypeReferenceExtractor,
} from '@daxserver/validation-schema-codegen/utils/dependency-type'
import { describe, expect, mock, test } from 'bun:test'
import type { ImportDeclaration, SourceFile, TypeAliasDeclaration, TypeNode } from 'ts-morph'

describe('DependencyCollector Unit Tests', () => {
  const createMockTypeAlias = (name: string): TypeAliasDeclaration => {
    return {
      getName: () => name,
      getTypeNode: () => undefined,
    } as unknown as TypeAliasDeclaration
  }

  const createMockSourceFile = (filePath: string): SourceFile => {
    return {
      getFilePath: () => filePath,
    } as SourceFile
  }

  const createMockImportDeclaration = (): ImportDeclaration => {
    return {} as ImportDeclaration
  }

  describe('constructor', () => {
    test('should initialize with default dependencies', () => {
      const collector = new DependencyCollector()
      expect(collector.getDependencies().size).toBe(0)
      expect(collector.getVisitedFiles().size).toBe(0)
    })

    test('should accept custom file resolver and type reference extractor', () => {
      const mockFileResolver = {} as DefaultFileResolver
      const mockTypeReferenceExtractor = {} as DefaultTypeReferenceExtractor
      const collector = new DependencyCollector(mockFileResolver, mockTypeReferenceExtractor)
      expect(collector.getDependencies().size).toBe(0)
    })
  })

  describe('getDependencies', () => {
    test('should return a copy of dependencies map', () => {
      const collector = new DependencyCollector()
      const mockTypeAlias = createMockTypeAlias('TestType')
      const mockSourceFile = createMockSourceFile('/test.ts')

      collector.addLocalTypes([mockTypeAlias], mockSourceFile)

      const dependencies1 = collector.getDependencies()
      const dependencies2 = collector.getDependencies()

      expect(dependencies1).not.toBe(dependencies2)
      expect(dependencies1.size).toBe(1)
      expect(dependencies2.size).toBe(1)
    })
  })

  describe('getVisitedFiles', () => {
    test('should return a copy of visited files set', () => {
      const collector = new DependencyCollector()

      const visitedFiles1 = collector.getVisitedFiles()
      const visitedFiles2 = collector.getVisitedFiles()

      expect(visitedFiles1).not.toBe(visitedFiles2)
    })
  })

  describe('addLocalTypes', () => {
    test('should add local types to dependencies', () => {
      const collector = new DependencyCollector()
      const mockTypeAlias = createMockTypeAlias('LocalType')
      const mockSourceFile = createMockSourceFile('/local.ts')

      collector.addLocalTypes([mockTypeAlias], mockSourceFile)

      const dependencies = collector.getDependencies()
      expect(dependencies.size).toBe(1)
      const dependency = dependencies.get('LocalType')
      expect(dependency?.typeAlias.getName()).toBe('LocalType')
      expect(dependency?.isImported).toBe(false)
    })

    test('should not add duplicate types', () => {
      const collector = new DependencyCollector()
      const mockTypeAlias1 = createMockTypeAlias('DuplicateType')
      const mockTypeAlias2 = createMockTypeAlias('DuplicateType')
      const mockSourceFile = createMockSourceFile('/local.ts')

      collector.addLocalTypes([mockTypeAlias1], mockSourceFile)
      collector.addLocalTypes([mockTypeAlias2], mockSourceFile)

      expect(collector.getDependencies().size).toBe(1)
    })
  })

  describe('collectFromImports', () => {
    test('should collect dependencies from imports using file resolver', () => {
      const mockFileResolver: FileResolver = {
        getModuleSpecifierSourceFile: mock(() => {
          const mockSourceFile = createMockSourceFile('/imported.ts')
          return mockSourceFile
        }),
        getFilePath: mock((sourceFile: SourceFile) => sourceFile.getFilePath()),
        getImportDeclarations: mock(() => []),
        getTypeAliases: mock(() => [
          createMockTypeAlias('ImportedType1'),
          createMockTypeAlias('ImportedType2'),
        ]),
      }

      const collector = new DependencyCollector(mockFileResolver)
      const mockImport = createMockImportDeclaration()

      const result = collector.collectFromImports([mockImport])

      expect(mockFileResolver.getModuleSpecifierSourceFile).toHaveBeenCalledWith(mockImport)
      expect(mockFileResolver.getTypeAliases).toHaveBeenCalled()
      expect(result).toHaveLength(2)
      expect(collector.getDependencies().size).toBe(2)
    })

    test('should handle missing source files', () => {
      const mockFileResolver: FileResolver = {
        getModuleSpecifierSourceFile: mock(() => undefined),
        getFilePath: mock(() => ''),
        getImportDeclarations: mock(() => []),
        getTypeAliases: mock(() => []),
      }

      const collector = new DependencyCollector(mockFileResolver)
      const mockImport = createMockImportDeclaration()

      const result = collector.collectFromImports([mockImport])

      expect(result).toHaveLength(0)
      expect(collector.getDependencies().size).toBe(0)
    })

    test('should prevent infinite recursion with circular imports', () => {
      const mockFileResolver: FileResolver = {
        getModuleSpecifierSourceFile: mock(() => {
          const mockSourceFile = createMockSourceFile('/circular.ts')
          return mockSourceFile
        }),
        getFilePath: mock(() => '/circular.ts'),
        getImportDeclarations: mock(() => [createMockImportDeclaration()]),
        getTypeAliases: mock(() => [createMockTypeAlias('CircularType')]),
      }

      const collector = new DependencyCollector(mockFileResolver)
      const mockImport = createMockImportDeclaration()

      const result = collector.collectFromImports([mockImport])

      expect(result).toHaveLength(1)
      expect(collector.getVisitedFiles().has('/circular.ts')).toBe(true)
    })
  })

  describe('topological sort integration', () => {
    test('should use type reference extractor for dependency resolution', () => {
      const mockTypeReferenceExtractor: TypeReferenceExtractor = {
        extractTypeReferences: mock(() => ['ReferencedType']),
      }

      const mockTypeAlias1 = createMockTypeAlias('TypeA')
      const mockTypeAlias2 = createMockTypeAlias('ReferencedType')

      // Mock getTypeNode to return a node
      mockTypeAlias1.getTypeNode = mock(() => ({}) as TypeNode)
      mockTypeAlias2.getTypeNode = mock(() => undefined)

      const collector = new DependencyCollector(
        undefined,
        mockTypeReferenceExtractor as DefaultTypeReferenceExtractor,
      )
      const mockSourceFile = createMockSourceFile('/test.ts')

      collector.addLocalTypes([mockTypeAlias1, mockTypeAlias2], mockSourceFile)

      collector.addLocalTypes([], mockSourceFile)

      // Access dependencies to potentially trigger internal operations
      const dependencies = collector.getDependencies()
      expect(dependencies.size).toBe(2)
    })
  })
})
