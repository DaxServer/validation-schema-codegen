import { createSourceFile, formatWithPrettier, generateFormattedCode } from '@test-fixtures/utils'
import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

describe('KeyOf typeof handling', () => {
  let project: Project

  beforeEach(() => {
    project = new Project()
  })

  test('should handle single string', () => {
    const sourceFile = createSourceFile(
      project,
      `
        const A = {
          a: 'a',
        }
        type T = keyof typeof A
      `,
    )

    expect(generateFormattedCode(sourceFile)).toBe(
      formatWithPrettier(`
        export const T = Type.Literal("a");

        export type T = Static<typeof T>;
      `),
    )
  })

  test('shoud handle single numeric', () => {
    const sourceFile = createSourceFile(
      project,
      `
        const A = {
          0: 'a',
        }
        type T = keyof typeof A
      `,
    )

    expect(generateFormattedCode(sourceFile)).toBe(
      formatWithPrettier(`
        export const T = Type.Literal(0);

        export type T = Static<typeof T>;
      `),
    )
  })

  test('should handle multiple string properties', () => {
    const sourceFile = createSourceFile(
      project,
      `
        const A = {
          a: 'a',
          b: 'b',
        }
        type T = keyof typeof A
      `,
    )

    expect(generateFormattedCode(sourceFile)).toBe(
      formatWithPrettier(`
        export const T = Type.Union([
          Type.Literal("a"),
          Type.Literal("b"),
        ]);

        export type T = Static<typeof T>;
      `),
    )
  })

  test('should handle multiple numeric properties', () => {
    const sourceFile = createSourceFile(
      project,
      `
        const A = {
          0: 'a',
          1: 'b',
        };
        type T = keyof typeof A
      `,
    )

    expect(generateFormattedCode(sourceFile)).toBe(
      formatWithPrettier(`
        export const T = Type.Union([
          Type.Literal(0),
          Type.Literal(1),
        ]);

        export type T = Static<typeof T>;
      `),
    )
  })

  test('should handle mixed properties', () => {
    const sourceFile = createSourceFile(
      project,
      `
        const A = {
          a: 'a',
          0: 'b',
        };
        type T = keyof typeof A
      `,
    )

    expect(generateFormattedCode(sourceFile)).toBe(
      formatWithPrettier(`
        export const T = Type.Union([
          Type.Literal("a"),
          Type.Literal(0),
        ]);

        export type T = Static<typeof T>;
      `),
    )
  })
})
