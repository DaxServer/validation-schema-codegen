import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'
import { generateCode } from '../../src/ts-morph-codegen'
import { createSourceFile } from './utils'
import type { TSConfigInput } from '../../src/utils/tsconfig-loader'

describe('generateCode with TSConfig support', () => {
  let project: Project

  beforeEach(() => {
    project = new Project()
  })

  describe('verbatimModuleSyntax handling', () => {
    const testCases = [
      {
        name: 'should use regular imports when verbatimModuleSyntax is false',
        tsConfig: { compilerOptions: { verbatimModuleSyntax: false } } as TSConfigInput,
        expectedImports: ['import { Type, Static } from "@sinclair/typebox";'],
      },
      {
        name: 'should use type-only imports when verbatimModuleSyntax is true',
        tsConfig: { compilerOptions: { verbatimModuleSyntax: true } } as TSConfigInput,
        expectedImports: [
          'import { Type } from "@sinclair/typebox";',
          'import { type Static } from "@sinclair/typebox";',
        ],
      },
      {
        name: 'should use regular imports when verbatimModuleSyntax is not specified',
        tsConfig: { compilerOptions: {} } as TSConfigInput,
        expectedImports: ['import { Type, Static } from "@sinclair/typebox";'],
      },
      {
        name: 'should use regular imports when compilerOptions is not specified',
        tsConfig: {} as TSConfigInput,
        expectedImports: ['import { Type, Static } from "@sinclair/typebox";'],
      },
      {
        name: 'should use regular imports when tsConfig is not provided',
        tsConfig: undefined,
        expectedImports: ['import { Type, Static } from "@sinclair/typebox";'],
      },
    ]

    for (const testCase of testCases) {
      test(testCase.name, async () => {
        const sourceFile = createSourceFile(
          project,
          `
          interface User {
            name: string
            age: number
          }
        `,
        )

        const options = testCase.tsConfig
          ? { exportEverything: false, tsConfig: testCase.tsConfig }
          : { exportEverything: false }
        const result = await generateCode(sourceFile, options)

        for (const expectedImport of testCase.expectedImports) {
          expect(result).toContain(expectedImport)
        }
      })
    }
  })

  describe('TSConfig input types', () => {
    const testInputTypes = [
      {
        name: 'should handle TSConfig object directly',
        input: { compilerOptions: { verbatimModuleSyntax: true } } as TSConfigInput,
        expectVerbatim: true,
        setupFile: false,
      },
      // {
      //   name: 'should handle string path to TSConfig',
      //   input: 'test-tsconfig.json' as TSConfigInput,
      //   expectVerbatim: true,
      //   setupFile: true,
      // },
      // {
      //   name: 'should handle URL-like object',
      //   input: { toString: () => 'url-tsconfig.json' } as TSConfigInput,
      //   expectVerbatim: true,
      //   setupFile: true,
      // },
    ]

    for (const testInput of testInputTypes) {
      test(testInput.name, async () => {
        if (testInput.setupFile) {
          const tsConfigContent = JSON.stringify({
            compilerOptions: {
              verbatimModuleSyntax: testInput.expectVerbatim,
            },
          })
          const fileName =
            typeof testInput.input === 'string' ? testInput.input : testInput.input.toString()
          project.createSourceFile(fileName, tsConfigContent)
        }

        const sourceFile = createSourceFile(
          project,
          `
          interface User {
            name: string
            age: number
          }
        `,
        )

        const result = await generateCode(sourceFile, {
          exportEverything: false,
          tsConfig: testInput.input,
        })

        if (testInput.expectVerbatim) {
          expect(result).toContain('import { Type } from "@sinclair/typebox";')
          expect(result).toContain('import { type Static } from "@sinclair/typebox";')
        } else {
          expect(result).toContain('import { Type, Static } from "@sinclair/typebox";')
        }
      })
    }
  })

  describe('exportEverything with TSConfig', () => {
    const exportTestCases = [
      {
        name: 'should work with exportEverything=true and verbatimModuleSyntax=false',
        exportEverything: true,
        verbatimModuleSyntax: false,
      },
      {
        name: 'should work with exportEverything=true and verbatimModuleSyntax=true',
        exportEverything: true,
        verbatimModuleSyntax: true,
      },
      {
        name: 'should work with exportEverything=false and verbatimModuleSyntax=false',
        exportEverything: false,
        verbatimModuleSyntax: false,
      },
      {
        name: 'should work with exportEverything=false and verbatimModuleSyntax=true',
        exportEverything: false,
        verbatimModuleSyntax: true,
      },
    ]

    for (const testCase of exportTestCases) {
      test(testCase.name, async () => {
        const sourceFile = createSourceFile(
          project,
          `
          interface User {
            name: string
            age: number
          }
        `,
        )

        const result = await generateCode(sourceFile, {
          exportEverything: testCase.exportEverything,
          tsConfig: {
            compilerOptions: {
              verbatimModuleSyntax: testCase.verbatimModuleSyntax,
            },
          },
        })

        if (testCase.verbatimModuleSyntax) {
          expect(result).toContain('import { Type } from "@sinclair/typebox";')
          expect(result).toContain('import { type Static } from "@sinclair/typebox";')
        } else {
          expect(result).toContain('import { Type, Static } from "@sinclair/typebox";')
        }

        if (testCase.exportEverything) {
          expect(result).toContain('export const User')
          expect(result).toContain('export type User')
        } else {
          expect(result).toContain('const User')
          expect(result).toContain('type User')
        }
      })
    }
  })
})
