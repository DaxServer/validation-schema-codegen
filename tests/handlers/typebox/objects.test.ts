import { createSourceFile, formatWithPrettier, generateFormattedCode } from '@test-fixtures/utils'
import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

describe('Object types', () => {
  let project: Project

  beforeEach(() => {
    project = new Project()
  })

  describe('without export', () => {
    test('object', () => {
      const sourceFile = createSourceFile(project, `type A = { a: string }`)

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          export const A = Type.Object({
            a: Type.String(),
          });

          export type A = Static<typeof A>;
        `),
      )
    })

    test('Tuple', () => {
      const sourceFile = createSourceFile(project, `type T = [number, null];`)

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          export const T = Type.Tuple([Type.Number(), Type.Null()]);

          export type T = Static<typeof T>;
        `),
      )
    })
  })

  describe('with export', () => {
    test('object', () => {
      const sourceFile = createSourceFile(project, `export type A = { a: string }`)

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          export const A = Type.Object({
            a: Type.String(),
          });

          export type A = Static<typeof A>;
        `),
      )
    })

    test('Tuple', () => {
      const sourceFile = createSourceFile(project, `export type T = [number, null];`)

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          export const T = Type.Tuple([Type.Number(), Type.Null()]);

          export type T = Static<typeof T>;
        `),
      )
    })
  })
})
