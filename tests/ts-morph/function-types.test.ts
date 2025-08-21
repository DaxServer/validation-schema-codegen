import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'
import { createSourceFile, formatWithPrettier } from './utils'
import { generateCode } from '../../src/ts-morph-codegen'

describe('Function types', () => {
  let project: Project

  beforeEach(() => {
    project = new Project()
  })

  describe('Arrow functions', () => {
    describe('without exports', () => {
      test('simple function type', async () => {
        const sourceFile = createSourceFile(project, `type A = () => string`)

        expect(formatWithPrettier(await generateCode(sourceFile), false)).toBe(
          formatWithPrettier(`
        const A = Type.Function([], Type.String());

        type A = Static<typeof A>;
      `),
        )
      })

      test('function type with parameters', async () => {
        const sourceFile = createSourceFile(project, `type A = (x: number, y: string) => boolean`)

        expect(formatWithPrettier(await generateCode(sourceFile), false)).toBe(
          formatWithPrettier(`
        const A = Type.Function([Type.Number(), Type.String()], Type.Boolean());

        type A = Static<typeof A>;
      `),
        )
      })

      test('function type with optional parameters', async () => {
        const sourceFile = createSourceFile(project, `type A = (x: number, y?: string) => void`)

        expect(formatWithPrettier(await generateCode(sourceFile), false)).toBe(
          formatWithPrettier(`
        const A = Type.Function([Type.Number(), Type.Optional(Type.String())], Type.Void());

        type A = Static<typeof A>;
      `),
        )
      })
    })

    describe('with exports', () => {
      test('simple function type', async () => {
        const sourceFile = createSourceFile(project, `export type A = () => string`)

        expect(
          formatWithPrettier(await generateCode(sourceFile, { exportEverything: true }), false),
        ).toBe(
          formatWithPrettier(`
        export const A = Type.Function([], Type.String());

        export type A = Static<typeof A>;
      `),
        )
      })

      test('function type with parameters', async () => {
        const sourceFile = createSourceFile(
          project,
          `export type A = (x: number, y: string) => boolean`,
        )

        expect(
          formatWithPrettier(await generateCode(sourceFile, { exportEverything: true }), false),
        ).toBe(
          formatWithPrettier(`
        export const A = Type.Function([Type.Number(), Type.String()], Type.Boolean());

        export type A = Static<typeof A>;
      `),
        )
      })

      test('function type with optional parameters', async () => {
        const sourceFile = createSourceFile(
          project,
          `export type A = (x: number, y?: string) => void`,
        )

        expect(
          formatWithPrettier(await generateCode(sourceFile, { exportEverything: true }), false),
        ).toBe(
          formatWithPrettier(`
        export const A = Type.Function([Type.Number(), Type.Optional(Type.String())], Type.Void());

        export type A = Static<typeof A>;
      `),
        )
      })
    })
  })

  describe('Function declarations', () => {
    describe('without exports', () => {
      test('simple function declaration', async () => {
        const sourceFile = createSourceFile(project, `function A(): string { return '' }`)

        expect(formatWithPrettier(await generateCode(sourceFile), false)).toBe(
          formatWithPrettier(`
        const A = Type.Function([], Type.String());

        type A = Static<typeof A>;
      `),
        )
      })

      test('function declaration with parameters', async () => {
        const sourceFile = createSourceFile(
          project,
          `function A(x: number, y: string): boolean { return true }`,
        )

        expect(formatWithPrettier(await generateCode(sourceFile), false)).toBe(
          formatWithPrettier(`
        const A = Type.Function([Type.Number(), Type.String()], Type.Boolean());

        type A = Static<typeof A>;
      `),
        )
      })

      test('function declaration with optional parameters', async () => {
        const sourceFile = createSourceFile(project, `function A(x: number, y?: string): void { }`)

        expect(formatWithPrettier(await generateCode(sourceFile), false)).toBe(
          formatWithPrettier(`
        const A = Type.Function([Type.Number(), Type.Optional(Type.String())], Type.Void());

        type A = Static<typeof A>;
      `),
        )
      })
    })

    describe('with exports', () => {
      test('simple function declaration', async () => {
        const sourceFile = createSourceFile(project, `export function A(): string { return '' }`)

        expect(
          formatWithPrettier(await generateCode(sourceFile, { exportEverything: true }), false),
        ).toBe(
          formatWithPrettier(`
        export const A = Type.Function([], Type.String());

        export type A = Static<typeof A>;
      `),
        )
      })

      test('function declaration with parameters', async () => {
        const sourceFile = createSourceFile(
          project,
          `export function A(x: number, y: string): boolean { return true }`,
        )

        expect(
          formatWithPrettier(await generateCode(sourceFile, { exportEverything: true }), false),
        ).toBe(
          formatWithPrettier(`
        export const A = Type.Function([Type.Number(), Type.String()], Type.Boolean());

        export type A = Static<typeof A>;
      `),
        )
      })

      test('function declaration with optional parameters', async () => {
        const sourceFile = createSourceFile(
          project,
          `export function A(x: number, y?: string): void { }`,
        )

        expect(
          formatWithPrettier(await generateCode(sourceFile, { exportEverything: true }), false),
        ).toBe(
          formatWithPrettier(`
        export const A = Type.Function([Type.Number(), Type.Optional(Type.String())], Type.Void());

        export type A = Static<typeof A>;
      `),
        )
      })
    })
  })
})
