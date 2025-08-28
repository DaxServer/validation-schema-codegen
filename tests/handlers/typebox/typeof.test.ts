import { createSourceFile, formatWithPrettier, generateFormattedCode } from '@test-fixtures/utils'
import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

describe('Typeof expressions', () => {
  let project: Project

  beforeEach(() => {
    project = new Project()
  })

  describe('without exports', () => {
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
          export const A = myVar;

          export type A = Static<typeof A>;
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
          export const A = MyNamespace_config;

          export type A = Static<typeof A>;
        `),
      )
    })
  })

  describe('with exports', () => {
    test('typeof variable', () => {
      const sourceFile = createSourceFile(
        project,
        `
          export const myVar = { x: 1, y: 'hello' }
          export type A = typeof myVar
        `,
      )

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          export const A = myVar;

          export type A = Static<typeof A>;
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
          export type A = typeof MyNamespace.config
        `,
      )

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          export const A = MyNamespace_config;

          export type A = Static<typeof A>;
        `),
      )
    })
  })
})
