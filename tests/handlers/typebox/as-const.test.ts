import { createSourceFile, formatWithPrettier, generateFormattedCode } from '@test-fixtures/utils'
import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

describe('As const expressions', () => {
  let project: Project

  beforeEach(() => {
    project = new Project()
  })

  describe('array literals with as const', () => {
    test('string literals array', () => {
      const sourceFile = createSourceFile(project, 'type A = ["hello", "world"] as const')

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(`
          export const A = Type.Tuple([Type.Literal("hello"), Type.Literal("world")]);

          export type A = Static<typeof A>;
        `),
      )
    })

    test('numeric literals array', () => {
      const sourceFile = createSourceFile(project, 'type A = [1, 2, 3] as const')

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(`
          export const A = Type.Tuple([Type.Literal(1), Type.Literal(2), Type.Literal(3)]);

          export type A = Static<typeof A>;
        `),
      )
    })

    test('boolean literals array', () => {
      const sourceFile = createSourceFile(project, 'type A = [true, false] as const')

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(`
          export const A = Type.Tuple([Type.Literal(true), Type.Literal(false)]);

          export type A = Static<typeof A>;
        `),
      )
    })

    test('mixed literals array', () => {
      const sourceFile = createSourceFile(project, 'type A = ["hello", 42, true] as const')

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(`
          export const A = Type.Tuple([Type.Literal("hello"), Type.Literal(42), Type.Literal(true)]);

          export type A = Static<typeof A>;
        `),
      )
    })

    test('empty array', () => {
      const sourceFile = createSourceFile(project, 'type A = [] as const')

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(`
          export const A = Type.Tuple([]);

          export type A = Static<typeof A>;
        `),
      )
    })
  })

  describe('non-array expressions with as const', () => {
    test('string literal', () => {
      const sourceFile = createSourceFile(project, 'type A = "hello" as const')

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(`
          export const A = Type.Literal("hello");

          export type A = Static<typeof A>;
        `),
      )
    })

    test('numeric literal', () => {
      const sourceFile = createSourceFile(project, 'type A = 42 as const')

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(`
          export const A = Type.Literal(42);

          export type A = Static<typeof A>;
        `),
      )
    })

    test('boolean literal', () => {
      const sourceFile = createSourceFile(project, 'type A = true as const')

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(`
          export const A = Type.Literal(true);

          export type A = Static<typeof A>;
        `),
      )
    })

    test('object literal', () => {
      const sourceFile = createSourceFile(project, 'type A = { a: 1, b: 2 } as const')

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(`
          export const A = Type.Object({
            a: Type.Literal(1),
            b: Type.Literal(2),
          });

          export type A = Static<typeof A>;
        `),
      )
    })
  })
})
