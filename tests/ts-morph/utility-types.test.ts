import {
  createSourceFile,
  formatWithPrettier,
  generateFormattedCode,
} from '@test-fixtures/ts-morph/utils'
import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

describe('Utility', () => {
  let project: Project

  beforeEach(() => {
    project = new Project()
  })

  describe('without export', () => {
    test('keyof', () => {
      const sourceFile = createSourceFile(
        project,
        `
          type T = keyof {
            x: number;
            y: string;
          };
        `,
      )

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          const T = Type.KeyOf(
            Type.Object({
              x: Type.Number(),
              y: Type.String(),
            }),
          );

          type T = Static<typeof T>;
        `),
      )
    })

    test('Record', () => {
      const sourceFile = createSourceFile(project, `type T = Record<string, number>;`)

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          const T = Type.Record(Type.String(), Type.Number());

          type T = Static<typeof T>;
        `),
      )
    })

    test('Partial', () => {
      const sourceFile = createSourceFile(project, `type T = Partial<{ a: 1; b: 2 }>;`)

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          const T = Type.Partial(
            Type.Object({
              a: Type.Literal(1),
              b: Type.Literal(2),
            })
          );

          type T = Static<typeof T>;
        `),
      )
    })

    test('Pick', () => {
      const sourceFile = createSourceFile(project, `type T = Pick<{ a: 1; b: 2 }, "a">;`)

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          const T = Type.Pick(
            Type.Object({
              a: Type.Literal(1),
              b: Type.Literal(2),
            }),
            Type.Literal("a")
          );

          type T = Static<typeof T>;
        `),
      )
    })

    test('Omit', () => {
      const sourceFile = createSourceFile(project, `type T = Omit<{ a: 1; b: 2 }, "a">;`)

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          const T = Type.Omit(
            Type.Object({
              a: Type.Literal(1),
              b: Type.Literal(2),
            }),
            Type.Literal("a")
          );

          type T = Static<typeof T>;
        `),
      )
    })

    test('Required', () => {
      const sourceFile = createSourceFile(project, `type T = Required<{ a?: 1; b?: 2 }>;`)

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          const T = Type.Required(
            Type.Object({
              a: Type.Optional(Type.Literal(1)),
              b: Type.Optional(Type.Literal(2)),
            })
          );

          type T = Static<typeof T>;
        `),
      )
    })

    test('Indexed Access', () => {
      const sourceFile = createSourceFile(
        project,
        `
          type A = {
            a: number;
          };

          type T = A["a"];
        `,
      )

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          const A = Type.Object({
            a: Type.Number(),
          });

          type A = Static<typeof A>;

          const T = Type.Index(A, Type.Literal("a"));

          type T = Static<typeof T>;
        `),
      )
    })
  })

  describe('with export', () => {
    test('keyof', () => {
      const sourceFile = createSourceFile(
        project,
        `
          export type T = keyof {
            x: number;
            y: string;
          };
        `,
      )

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          export const T = Type.KeyOf(
            Type.Object({
              x: Type.Number(),
              y: Type.String(),
            }),
          );

          export type T = Static<typeof T>;
        `),
      )
    })

    test('Record', () => {
      const sourceFile = createSourceFile(project, `export type T = Record<string, number>;`)

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          export const T = Type.Record(Type.String(), Type.Number());

          export type T = Static<typeof T>;
        `),
      )
    })

    test('Partial', () => {
      const sourceFile = createSourceFile(project, `export type T = Partial<{ a: 1; b: 2 }>;`)

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          export const T = Type.Partial(
            Type.Object({
              a: Type.Literal(1),
              b: Type.Literal(2),
            })
          );

          export type T = Static<typeof T>;
        `),
      )
    })

    test('Pick', () => {
      const sourceFile = createSourceFile(project, `export type T = Pick<{ a: 1; b: 2 }, "a">;`)

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          export const T = Type.Pick(
            Type.Object({
              a: Type.Literal(1),
              b: Type.Literal(2),
            }),
            Type.Literal("a")
          );

          export type T = Static<typeof T>;
        `),
      )
    })

    test('Omit', () => {
      const sourceFile = createSourceFile(project, `export type T = Omit<{ a: 1; b: 2 }, "a">;`)

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          export const T = Type.Omit(
            Type.Object({
              a: Type.Literal(1),
              b: Type.Literal(2),
            }),
            Type.Literal("a")
          );

          export type T = Static<typeof T>;
        `),
      )
    })

    test('Required', () => {
      const sourceFile = createSourceFile(project, `export type T = Required<{ a?: 1; b?: 2 }>;`)

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          export const T = Type.Required(
            Type.Object({
              a: Type.Optional(Type.Literal(1)),
              b: Type.Optional(Type.Literal(2)),
            })
          );

          export type T = Static<typeof T>;
        `),
      )
    })

    test('Indexed Access', () => {
      const sourceFile = createSourceFile(
        project,
        `
          export type A = {
            a: number;
          };

          export type T = A["a"];
        `,
      )

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          export const A = Type.Object({
            a: Type.Number(),
          });

          export type A = Static<typeof A>;

          export const T = Type.Index(A, Type.Literal("a"));

          export type T = Static<typeof T>;
        `),
      )
    })
  })
})
