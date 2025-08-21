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
    test('string', async () => {
      const sourceFile = createSourceFile(project, `type A = string`)

      expect(formatWithPrettier(await generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      const A = Type.String();

      type A = Static<typeof A>;
    `),
      )
    })

    test('number', async () => {
      const sourceFile = createSourceFile(project, `type A = number`)

      expect(formatWithPrettier(await generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      const A = Type.Number();

      type A = Static<typeof A>;
    `),
      )
    })

    test('boolean', async () => {
      const sourceFile = createSourceFile(project, `type A = boolean`)

      expect(formatWithPrettier(await generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      const A = Type.Boolean();

      type A = Static<typeof A>;
    `),
      )
    })

    test('any', async () => {
      const sourceFile = createSourceFile(project, `type A = any`)

      expect(formatWithPrettier(await generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      const A = Type.Any();

      type A = Static<typeof A>;
    `),
      )
    })

    test('unknown', async () => {
      const sourceFile = createSourceFile(project, `type A = unknown`)

      expect(formatWithPrettier(await generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      const A = Type.Unknown();

      type A = Static<typeof A>;
    `),
      )
    })

    test('never', async () => {
      const sourceFile = createSourceFile(project, `type A = never`)

      expect(formatWithPrettier(await generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      const A = Type.Never();

      type A = Static<typeof A>;
    `),
      )
    })

    test('null', async () => {
      const sourceFile = createSourceFile(project, `type A = null`)

      expect(formatWithPrettier(await generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      const A = Type.Null();

      type A = Static<typeof A>;
    `),
      )
    })
  })

  describe('with exports', () => {
    test('string', async () => {
      const sourceFile = createSourceFile(project, `export type A = string`)

      expect(formatWithPrettier(await generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      export const A = Type.String();

      export type A = Static<typeof A>;
    `),
      )
    })

    test('number', async () => {
      const sourceFile = createSourceFile(project, `export type A = number`)

      expect(formatWithPrettier(await generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      export const A = Type.Number();

      export type A = Static<typeof A>;
    `),
      )
    })

    test('boolean', async () => {
      const sourceFile = createSourceFile(project, `export type A = boolean`)

      expect(formatWithPrettier(await generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      export const A = Type.Boolean();

      export type A = Static<typeof A>;
    `),
      )
    })

    test('any', async () => {
      const sourceFile = createSourceFile(project, `export type A = any`)

      expect(formatWithPrettier(await generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      export const A = Type.Any();

      export type A = Static<typeof A>;
    `),
      )
    })

    test('unknown', async () => {
      const sourceFile = createSourceFile(project, `export type A = unknown`)

      expect(formatWithPrettier(await generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      export const A = Type.Unknown();

      export type A = Static<typeof A>;
    `),
      )
    })

    test('never', async () => {
      const sourceFile = createSourceFile(project, `export type A = never`)

      expect(formatWithPrettier(await generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      export const A = Type.Never();

      export type A = Static<typeof A>;
    `),
      )
    })

    test('null', async () => {
      const sourceFile = createSourceFile(project, `export type A = null`)

      expect(formatWithPrettier(await generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      export const A = Type.Null();

      export type A = Static<typeof A>;
    `),
      )
    })
  })
})
