import { createSourceFile, formatWithPrettier, generateFormattedCode } from '@test-fixtures/utils'
import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

describe('Advanced types', () => {
  let project: Project

  beforeEach(() => {
    project = new Project()
  })

  describe('Typeof expressions', () => {
    test('typeof variable', () => {
      const sourceFile = createSourceFile(
        project,
        `
          const myVar = { x: 1, y: 'hello' }
          type A = typeof myVar
        `,
      )

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          const A = myVar;

          type A = Static<typeof A>;
        `),
      )
    })

    test('typeof with qualified name', () => {
      const sourceFile = createSourceFile(
        project,
        `
          namespace MyNamespace {
            export const config = { port: 3000 }
          }
          type A = typeof MyNamespace.config
        `,
      )

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          const A = MyNamespace_config;

          type A = Static<typeof A>;
        `),
      )
    })
  })
})
