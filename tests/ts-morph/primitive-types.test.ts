import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'
import { createSourceFile, formatWithPrettier } from './utils'
import { generateCode } from '../../src/ts-morph-codegen'

describe('Primitive types', () => {
  let project: Project

  beforeEach(() => {
    project = new Project()
  })

  describe('without exports', () => {
    test('string', () => {
      const sourceFile = createSourceFile(project, `type A = string`)

      expect(formatWithPrettier(generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      const A = Type.String();

      type A = Static<typeof A>;
    `),
      )
    })

    test('number', () => {
      const sourceFile = createSourceFile(project, `type A = number`)

      expect(formatWithPrettier(generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      const A = Type.Number();

      type A = Static<typeof A>;
    `),
      )
    })

    test('boolean', () => {
      const sourceFile = createSourceFile(project, `type A = boolean`)

      expect(formatWithPrettier(generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      const A = Type.Boolean();

      type A = Static<typeof A>;
    `),
      )
    })

    test('any', () => {
      const sourceFile = createSourceFile(project, `type A = any`)

      expect(formatWithPrettier(generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      const A = Type.Any();

      type A = Static<typeof A>;
    `),
      )
    })

    test('unknown', () => {
      const sourceFile = createSourceFile(project, `type A = unknown`)

      expect(formatWithPrettier(generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      const A = Type.Unknown();

      type A = Static<typeof A>;
    `),
      )
    })

    test('never', () => {
      const sourceFile = createSourceFile(project, `type A = never`)

      expect(formatWithPrettier(generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      const A = Type.Never();

      type A = Static<typeof A>;
    `),
      )
    })

    test('null', () => {
      const sourceFile = createSourceFile(project, `type A = null`)

      expect(formatWithPrettier(generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      const A = Type.Null();

      type A = Static<typeof A>;
    `),
      )
    })
  })

  describe('with exports', () => {
    test('string', () => {
      const sourceFile = createSourceFile(project, `export type A = string`)

      expect(formatWithPrettier(generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      export const A = Type.String();

      export type A = Static<typeof A>;
    `),
      )
    })

    test('number', () => {
      const sourceFile = createSourceFile(project, `export type A = number`)

      expect(formatWithPrettier(generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      export const A = Type.Number();

      export type A = Static<typeof A>;
    `),
      )
    })

    test('boolean', () => {
      const sourceFile = createSourceFile(project, `export type A = boolean`)

      expect(formatWithPrettier(generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      export const A = Type.Boolean();

      export type A = Static<typeof A>;
    `),
      )
    })

    test('any', () => {
      const sourceFile = createSourceFile(project, `export type A = any`)

      expect(formatWithPrettier(generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      export const A = Type.Any();

      export type A = Static<typeof A>;
    `),
      )
    })

    test('unknown', () => {
      const sourceFile = createSourceFile(project, `export type A = unknown`)

      expect(formatWithPrettier(generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      export const A = Type.Unknown();

      export type A = Static<typeof A>;
    `),
      )
    })

    test('never', () => {
      const sourceFile = createSourceFile(project, `export type A = never`)

      expect(formatWithPrettier(generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      export const A = Type.Never();

      export type A = Static<typeof A>;
    `),
      )
    })

    test('null', () => {
      const sourceFile = createSourceFile(project, `export type A = null`)

      expect(formatWithPrettier(generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      export const A = Type.Null();

      export type A = Static<typeof A>;
    `),
      )
    })
  })
})
