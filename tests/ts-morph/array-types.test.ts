import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'
import { createSourceFile, formatWithPrettier } from './utils'
import { generateCode } from '../../src/ts-morph-codegen'

describe('Array types', () => {
  let project: Project

  beforeEach(() => {
    project = new Project()
  })

  describe('without export', () => {
    test('Array<string>', () => {
      const sourceFile = createSourceFile(project, `type A = string[]`)

      expect(formatWithPrettier(generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      const A = Type.Array(Type.String());

      type A = Static<typeof A>;
    `),
      )
    })

    test('string[]', () => {
      const sourceFile = createSourceFile(project, `type A = string[]`)

      expect(formatWithPrettier(generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      const A = Type.Array(Type.String());

      type A = Static<typeof A>;
    `),
      )
    })

    test('Union', () => {
      const sourceFile = createSourceFile(
        project,
        `type A = number;
      type B = string;
      type T = A | B;`,
      )

      expect(formatWithPrettier(generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      const A = Type.Number();

      type A = Static<typeof A>;

      const B = Type.String();

      type B = Static<typeof B>;

      const T = Type.Union([A, B]);

      type T = Static<typeof T>;
    `),
      )
    })

    test('Intersect', () => {
      const sourceFile = createSourceFile(
        project,
        `type T = {
        x: number;
      } & {
        y: string;
      };`,
      )

      expect(formatWithPrettier(generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      const T = Type.Intersect([
        Type.Object({
          x: Type.Number(),
        }),
        Type.Object({
          y: Type.String(),
        }),
      ]);

      type T = Static<typeof T>;
    `),
      )
    })

    test('Literal', () => {
      const sourceFile = createSourceFile(project, `type T = "a" | "b";`)

      expect(formatWithPrettier(generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      const T = Type.Union([Type.Literal("a"), Type.Literal("b")]);

      type T = Static<typeof T>;
    `),
      )
    })
  })

  describe('with export', () => {
    test('Array<string>', () => {
      const sourceFile = createSourceFile(project, `export type A = string[]`)

      expect(formatWithPrettier(generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      export const A = Type.Array(Type.String());

      export type A = Static<typeof A>;
    `),
      )
    })

    test('string[]', () => {
      const sourceFile = createSourceFile(project, `export type A = string[]`)

      expect(formatWithPrettier(generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      export const A = Type.Array(Type.String());

      export type A = Static<typeof A>;
    `),
      )
    })

    test('Union', () => {
      const sourceFile = createSourceFile(
        project,
        `export type A = number;
      export type B = string;
      export type T = A | B;`,
      )

      expect(formatWithPrettier(generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      export const A = Type.Number();

      export type A = Static<typeof A>;

      export const B = Type.String();

      export type B = Static<typeof B>;

      export const T = Type.Union([A, B]);

      export type T = Static<typeof T>;
    `),
      )
    })

    test('Intersect', () => {
      const sourceFile = createSourceFile(
        project,
        `export type T = {
        x: number;
      } & {
        y: string;
      };`,
      )

      expect(formatWithPrettier(generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      export const T = Type.Intersect([
        Type.Object({
          x: Type.Number(),
        }),
        Type.Object({
          y: Type.String(),
        }),
      ]);

      export type T = Static<typeof T>;
    `),
      )
    })

    test('Literal', () => {
      const sourceFile = createSourceFile(
        project,
        `
      export type T = "a" | "b";
      `,
      )

      expect(formatWithPrettier(generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      export const T = Type.Union([Type.Literal("a"), Type.Literal("b")]);

      export type T = Static<typeof T>;
    `),
      )
    })
  })
})
