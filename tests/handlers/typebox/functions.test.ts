import { createSourceFile, formatWithPrettier, generateFormattedCode } from '@test-fixtures/utils'
import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

describe('Function types', () => {
  let project: Project

  beforeEach(() => {
    project = new Project()
  })

  describe('Arrow functions', () => {
    describe('without exports', () => {
      test('simple function type', () => {
        const sourceFile = createSourceFile(project, `type A = () => string`)

        expect(generateFormattedCode(sourceFile)).toBe(
          formatWithPrettier(`
            export const A = Type.Function([], Type.String());

            export type A = Static<typeof A>;
          `),
        )
      })

      test('function type with parameters', () => {
        const sourceFile = createSourceFile(project, `type A = (x: number, y: string) => boolean`)

        expect(generateFormattedCode(sourceFile)).toBe(
          formatWithPrettier(`
            export const A = Type.Function([Type.Number(), Type.String()], Type.Boolean());

            export type A = Static<typeof A>;
          `),
        )
      })

      test('function type with optional parameters', () => {
        const sourceFile = createSourceFile(project, `type A = (x: number, y?: string) => void`)

        expect(generateFormattedCode(sourceFile)).toBe(
          formatWithPrettier(`
            export const A = Type.Function([Type.Number(), Type.Optional(Type.String())], Type.Void());

            export type A = Static<typeof A>;
          `),
        )
      })
    })

    describe('with exports', () => {
      test('simple function type', () => {
        const sourceFile = createSourceFile(project, `export type A = () => string`)

        expect(generateFormattedCode(sourceFile)).toBe(
          formatWithPrettier(`
            export const A = Type.Function([], Type.String());

            export type A = Static<typeof A>;
          `),
        )
      })

      test('function type with parameters', () => {
        const sourceFile = createSourceFile(
          project,
          `export type A = (x: number, y: string) => boolean`,
        )

        expect(generateFormattedCode(sourceFile)).toBe(
          formatWithPrettier(`
            export const A = Type.Function([Type.Number(), Type.String()], Type.Boolean());

            export type A = Static<typeof A>;
          `),
        )
      })

      test('function type with optional parameters', () => {
        const sourceFile = createSourceFile(
          project,
          `export type A = (x: number, y?: string) => void`,
        )

        expect(generateFormattedCode(sourceFile)).toBe(
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
      test('simple function declaration', () => {
        const sourceFile = createSourceFile(project, `function A(): string { return '' }`)

        expect(generateFormattedCode(sourceFile)).toBe(
          formatWithPrettier(`
            export const A = Type.Function([], Type.String());

            export type A = Static<typeof A>;
          `),
        )
      })

      test('function declaration with parameters', () => {
        const sourceFile = createSourceFile(
          project,
          `function A(x: number, y: string): boolean { return true }`,
        )

        expect(generateFormattedCode(sourceFile)).toBe(
          formatWithPrettier(`
            export const A = Type.Function([Type.Number(), Type.String()], Type.Boolean());

            export type A = Static<typeof A>;
          `),
        )
      })

      test('function declaration with optional parameters', () => {
        const sourceFile = createSourceFile(project, `function A(x: number, y?: string): void { }`)

        expect(generateFormattedCode(sourceFile)).toBe(
          formatWithPrettier(`
            export const A = Type.Function([Type.Number(), Type.Optional(Type.String())], Type.Void());

            export type A = Static<typeof A>;
          `),
        )
      })
    })

    describe('with exports', () => {
      test('simple function declaration', () => {
        const sourceFile = createSourceFile(project, `export function A(): string { return '' }`)

        expect(generateFormattedCode(sourceFile)).toBe(
          formatWithPrettier(`
            export const A = Type.Function([], Type.String());

            export type A = Static<typeof A>;
          `),
        )
      })

      test('function declaration with parameters', () => {
        const sourceFile = createSourceFile(
          project,
          `export function A(x: number, y: string): boolean { return true }`,
        )

        expect(generateFormattedCode(sourceFile)).toBe(
          formatWithPrettier(`
            export const A = Type.Function([Type.Number(), Type.String()], Type.Boolean());

            export type A = Static<typeof A>;
          `),
        )
      })

      test('function declaration with optional parameters', () => {
        const sourceFile = createSourceFile(
          project,
          `export function A(x: number, y?: string): void { }`,
        )

        expect(generateFormattedCode(sourceFile)).toBe(
          formatWithPrettier(`
            export const A = Type.Function([Type.Number(), Type.Optional(Type.String())], Type.Void());

            export type A = Static<typeof A>;
          `),
        )
      })
    })
  })
})
