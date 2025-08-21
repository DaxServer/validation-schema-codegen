import { describe, expect, test } from 'bun:test'
import { loadTSConfig } from '../../src/utils/tsconfig-loader'

describe('TSConfig utility', () => {
  // let project: Project

  // beforeEach(() => {
  //   project = new Project()
  // })

  describe('loadTSConfig', () => {
    test('should handle TSConfig object directly', () => {
      const tsConfig = {
        compilerOptions: {
          verbatimModuleSyntax: true,
          strict: true,
        },
      }

      expect(loadTSConfig(tsConfig)).resolves.toMatchObject({
        verbatimModuleSyntax: true,
        strict: true,
      })
    })

    test('should handle TSConfig object with verbatimModuleSyntax false', () => {
      const tsConfig = {
        compilerOptions: {
          verbatimModuleSyntax: false,
          strict: false,
        },
      }

      expect(loadTSConfig(tsConfig)).resolves.toMatchObject({
        verbatimModuleSyntax: false,
        strict: false,
      })
    })

    test('should handle TSConfig object without verbatimModuleSyntax', () => {
      const tsConfig = {
        compilerOptions: {
          strict: true,
        },
      }

      expect(loadTSConfig(tsConfig)).resolves.toMatchObject({
        verbatimModuleSyntax: false,
        strict: true,
      })
    })

    test('should handle TSConfig object without compilerOptions', () => {
      const tsConfig = {}

      expect(loadTSConfig(tsConfig)).resolves.toMatchObject({
        verbatimModuleSyntax: false,
      })
    })

    // test('should handle string path to existing tsconfig.json', () => {
    //   const tsConfigContent = JSON.stringify({
    //     compilerOptions: {
    //       verbatimModuleSyntax: true,
    //       target: 'ES2020',
    //     },
    //   })

    //   project.createSourceFile('test-tsconfig.json', tsConfigContent)

    //   expect(loadTSConfig('test-tsconfig.json')).resolves.toMatchObject({
    //     verbatimModuleSyntax: true,
    //     target: 'ES2020',
    //   })
    // })

    // test('should handle absolute path to tsconfig.json', () => {
    //   const tsConfigContent = JSON.stringify({
    //     compilerOptions: {
    //       verbatimModuleSyntax: false,
    //       module: 'CommonJS',
    //     },
    //   })

    //   project.createSourceFile('/absolute/path/tsconfig.json', tsConfigContent)

    //   expect(loadTSConfig('/absolute/path/tsconfig.json')).resolves.toMatchObject({
    //     verbatimModuleSyntax: false,
    //     module: 'CommonJS',
    //   })
    // })

    test('should throw error for non-existent file path', () => {
      expect(loadTSConfig('non-existent-tsconfig.json')).rejects.toThrow(
        "TSConfig loading failed: non-existent-tsconfig.json Reason: Error: ENOENT: no such file or directory, open 'non-existent-tsconfig.json'",
      )
    })

    // test('should throw error for invalid JSON in file', () => {
    //   project.createSourceFile('invalid-tsconfig.json', '{ invalid json }')

    //   expect(loadTSConfig('invalid-tsconfig.json')).rejects.toThrow('Invalid JSON in TSConfig file')
    // })

    // test('should handle URL-like object with toString method', () => {
    //   const urlLike = {
    //     toString: () => 'url-tsconfig.json',
    //   }

    //   const tsConfigContent = JSON.stringify({
    //     compilerOptions: {
    //       verbatimModuleSyntax: true,
    //     },
    //   })

    //   project.createSourceFile('url-tsconfig.json', tsConfigContent)

    //   expect(loadTSConfig(urlLike as TSConfigInput)).resolves.toMatchObject({
    //     verbatimModuleSyntax: true,
    //   })
    // })
  })

  describe('verbatimModuleSyntax detection', () => {
    test('should correctly identify when verbatimModuleSyntax is enabled', () => {
      const tsConfig = {
        compilerOptions: {
          verbatimModuleSyntax: true,
        },
      }

      expect(loadTSConfig(tsConfig)).resolves.toMatchObject({
        verbatimModuleSyntax: true,
      })
    })

    test('should correctly identify when verbatimModuleSyntax is disabled', () => {
      const tsConfig = {
        compilerOptions: {
          verbatimModuleSyntax: false,
        },
      }

      expect(loadTSConfig(tsConfig)).resolves.toMatchObject({
        verbatimModuleSyntax: false,
      })
    })

    test('should default verbatimModuleSyntax to false when not specified', () => {
      const tsConfig = {
        compilerOptions: {
          strict: true,
        },
      }

      expect(loadTSConfig(tsConfig)).resolves.toMatchObject({
        verbatimModuleSyntax: false,
      })
    })
  })
})
