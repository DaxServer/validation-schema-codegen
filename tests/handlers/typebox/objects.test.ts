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

      expect(generateFormattedCode(sourceFile)).toBe(
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

      expect(generateFormattedCode(sourceFile)).toBe(
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

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(`
          export const A = Type.Object({
            a: Type.String(),
          });

          export type A = Static<typeof A>;
        `),
      )
    })

    test('object with various property name formats', () => {
      const sourceFile = createSourceFile(
        project,
        `
          export type ComplexProps = {
            identifier: string;
            'single-quoted': number;
            "double-quoted": boolean;
            'with spaces': string;
            123: number;
            'normal': string;
          }
        `,
      )

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(`
          export const ComplexProps = Type.Object({
            identifier: Type.String(),
            'single-quoted': Type.Number(),
            'double-quoted': Type.Boolean(),
            'with spaces': Type.String(),
            123: Type.Number(),
            normal: Type.String(),
          });

          export type ComplexProps = Static<typeof ComplexProps>;
        `),
      )
    })

    test('Tuple', () => {
      const sourceFile = createSourceFile(project, `export type T = [number, null];`)

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(`
          export const T = Type.Tuple([Type.Number(), Type.Null()]);

          export type T = Static<typeof T>;
        `),
      )
    })
  })
})
