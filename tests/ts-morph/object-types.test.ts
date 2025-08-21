import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'
import { createSourceFile, formatWithPrettier, generateFormattedCode } from './utils'

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
          const A = Type.Object({
            a: Type.String(),
          });

          type A = Static<typeof A>;
        `),
      )
    })

    test('Tuple', () => {
      const sourceFile = createSourceFile(project, `type T = [number, null];`)

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          const T = Type.Tuple([Type.Number(), Type.Null()]);

          type T = Static<typeof T>;
        `),
      )
    })

    test('interface', () => {
      const sourceFile = createSourceFile(project, `interface A { a: string }`)

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          const A = Type.Object({
            a: Type.String(),
          });

          type A = Static<typeof A>;
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

    test('interface', () => {
      const sourceFile = createSourceFile(project, `export interface A { a: string }`)

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          export const A = Type.Object({
            a: Type.String(),
          });

          export type A = Static<typeof A>;
        `),
      )
    })
  })
})
