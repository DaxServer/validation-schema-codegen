import { CompilerConfig } from '@daxserver/validation-schema-codegen/utils/compiler-config'
import { createSourceFile, formatWithPrettier, generateFormattedCode } from '@test-fixtures/utils'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { Project, ts } from 'ts-morph'

describe('Script Target Integration', () => {
  let compilerConfig: CompilerConfig

  beforeEach(() => {
    compilerConfig = CompilerConfig.getInstance()
    compilerConfig.reset()
  })

  afterEach(() => {
    compilerConfig.reset()
  })

  test('should use project compiler options for script target', () => {
    const project = new Project({
      compilerOptions: {
        target: ts.ScriptTarget.ES2015,
      },
    })

    const sourceFile = createSourceFile(
      project,
      `
        interface TestInterface {
          validName: string;
          "quoted-property": number;
          "valid_identifier": string;
          "invalid-property": string;
        }
      `,
    )

    expect(generateFormattedCode(sourceFile)).toBe(
      formatWithPrettier(
        `
        export const TestInterface = Type.Object({
          validName: Type.String(),
          "quoted-property": Type.Number(),
          valid_identifier: Type.String(),
          "invalid-property": Type.String(),
        })

        export type TestInterface = Static<typeof TestInterface>
      `,
      ),
    )
  })

  test('should work with different script targets', () => {
    const testCases = [
      ts.ScriptTarget.ES5,
      ts.ScriptTarget.ES2015,
      ts.ScriptTarget.ES2020,
      ts.ScriptTarget.Latest,
    ]

    for (const target of testCases) {
      const project = new Project({
        compilerOptions: {
          target,
        },
      })

      const sourceFile = createSourceFile(
        project,
        `
          interface TestInterface {
            validName: string;
            "invalid-name": number;
            π: boolean;
          }
        `,
      )

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(
          `
          export const TestInterface = Type.Object({
            validName: Type.String(),
            "invalid-name": Type.Number(),
            π: Type.Boolean(),
          })

          export type TestInterface = Static<typeof TestInterface>
        `,
        ),
      )
    }
  })

  test('should handle numeric property names correctly', () => {
    const project = new Project({
      compilerOptions: {
        target: ts.ScriptTarget.Latest,
      },
    })

    const sourceFile = createSourceFile(
      project,
      `
        interface T {
          123: string;
          "456": number;
          validName: boolean;
          "valid_name": string;
        }
      `,
    )

    expect(generateFormattedCode(sourceFile)).toBe(
      formatWithPrettier(
        `
        export const T = Type.Object({
          123: Type.String(),
          "456": Type.Number(),
          validName: Type.Boolean(),
          valid_name: Type.String(),
        })

        export type T = Static<typeof T>
      `,
      ),
    )
  })
})
