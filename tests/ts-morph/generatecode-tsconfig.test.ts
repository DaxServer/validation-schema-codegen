import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'
import { generateCode } from '../../src/ts-morph-codegen'
import { createSourceFile } from './utils'

describe('generateCode with automatic TSConfig detection', () => {
  let project: Project

  beforeEach(() => {
    project = new Project()
  })

  describe('automatic tsconfig detection', () => {
    test('should automatically detect project tsconfig and use appropriate imports', async () => {
      const sourceFile = createSourceFile(
        project,
        `
        interface User {
          name: string
          age: number
        }
      `,
      )

      const result = await generateCode(sourceFile, { exportEverything: false })

      // Since the project tsconfig has verbatimModuleSyntax: true, expect type-only imports
      expect(result).toContain('import { Type } from "@sinclair/typebox";')
      expect(result).toContain('import { type Static } from "@sinclair/typebox";')
      expect(result).toContain('const User = Type.Object({')
      expect(result).toContain('type User = Static<typeof User>;')
    })

    test('should work with exportEverything option', async () => {
      const sourceFile = createSourceFile(
        project,
        `
        interface User {
          name: string
          age: number
        }
      `,
      )

      const result = await generateCode(sourceFile, { exportEverything: true })

      // Since the project tsconfig has verbatimModuleSyntax: true, expect type-only imports
      expect(result).toContain('import { Type } from "@sinclair/typebox";')
      expect(result).toContain('import { type Static } from "@sinclair/typebox";')
      expect(result).toContain('export const User = Type.Object({')
      expect(result).toContain('export type User = Static<typeof User>;')
    })
  })

  describe('interface handling', () => {
    test('should handle basic interfaces', async () => {
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
      })

      expect(result).toContain('import { Type } from "@sinclair/typebox";')
      expect(result).toContain('import { type Static } from "@sinclair/typebox";')
      expect(result).toContain('const User = Type.Object({')
      expect(result).toContain('type User = Static<typeof User>;')
    })
  })

  describe('exportEverything option', () => {
    const exportTestCases = [
      {
        name: 'should work with exportEverything=true',
        exportEverything: true,
      },
      {
        name: 'should work with exportEverything=false',
        exportEverything: false,
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
        })

        expect(result).toContain('import { Type } from "@sinclair/typebox";')
        expect(result).toContain('import { type Static } from "@sinclair/typebox";')

        if (testCase.exportEverything) {
          expect(result).toMatch(/^\s*export\s+const User/m)
          expect(result).toMatch(/^\s*export\s+type User/m)
        } else {
          expect(result).toMatch(/^\s*const User/m)
          expect(result).toMatch(/^\s*type User/m)
          expect(result).not.toMatch(/^\s*export\s+const User/m)
          expect(result).not.toMatch(/^\s*export\s+type User/m)
        }
      })
    }
  })
})
