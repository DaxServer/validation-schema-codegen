import { createSourceFile, formatWithPrettier, generateFormattedCode } from '@test-fixtures/utils'
import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

describe('Interfaces', () => {
  let project: Project

  beforeEach(() => {
    project = new Project()
  })

  describe('export', () => {
    test('without export', () => {
      const sourceFile = createSourceFile(project, `interface A { a: string }`)

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          export const A = Type.Object({
            a: Type.String(),
          });

          export type A = Static<typeof A>;
        `),
      )
    })

    test('with export', () => {
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

  describe('inheritance', () => {
    test('interface extending another interface', () => {
      const sourceFile = createSourceFile(
        project,
        `
          interface Base { id: string }
          interface Extended extends Base { name: string }
        `,
      )

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          export const Base = Type.Object({
            id: Type.String(),
          });

          export type Base = Static<typeof Base>;

          export const Extended = Type.Composite([
            Base,
            Type.Object({
              name: Type.String(),
            }),
          ]);

          export type Extended = Static<typeof Extended>;
        `),
      )
    })

    test('interface extending multiple interfaces', () => {
      const sourceFile = createSourceFile(
        project,
        `
          interface A { a: string }
          interface B { b: number }
          interface C extends A, B { c: boolean }
        `,
      )

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          export const A = Type.Object({
            a: Type.String(),
          });

          export type A = Static<typeof A>;

          export const B = Type.Object({
            b: Type.Number(),
          });

          export type B = Static<typeof B>;

          export const C = Type.Composite([
            A,
            B,
            Type.Object({
              c: Type.Boolean(),
            }),
          ]);

          export type C = Static<typeof C>;
        `),
      )
    })

    test('exported interface extending another interface', () => {
      const sourceFile = createSourceFile(
        project,
        `
          export interface Base { id: string }
          export interface Extended extends Base { name: string }
        `,
      )

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          export const Base = Type.Object({
            id: Type.String(),
          });

          export type Base = Static<typeof Base>;

          export const Extended = Type.Composite([
            Base,
            Type.Object({
              name: Type.String(),
            }),
          ]);

          export type Extended = Static<typeof Extended>;
        `),
      )
    })

    test('interface extending with no additional properties', () => {
      const sourceFile = createSourceFile(
        project,
        `
          interface Base { id: string }
          interface Extended extends Base {}
        `,
      )

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          export const Base = Type.Object({
            id: Type.String(),
          });

          export type Base = Static<typeof Base>;

          export const Extended = Type.Composite([
            Base,
            Type.Object({}),
          ]);

          export type Extended = Static<typeof Extended>;
        `),
      )
    })

    test('nested interface inheritance', () => {
      const sourceFile = createSourceFile(
        project,
        `
          interface A { a: string }
          interface B extends A { b: number }
          interface C extends B { c: boolean }
        `,
      )

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          export const A = Type.Object({
            a: Type.String(),
          });

          export type A = Static<typeof A>;

          export const B = Type.Composite([
            A,
            Type.Object({
              b: Type.Number(),
            }),
          ]);

          export type B = Static<typeof B>;

          export const C = Type.Composite([
            B,
            Type.Object({
              c: Type.Boolean(),
            }),
          ]);

          export type C = Static<typeof C>;
        `),
      )
    })

    describe('generic types', () => {
      test('generic types', () => {
        const sourceFile = createSourceFile(
          project,
          `
            interface A<T> { a: T }
            interface B extends A<number> { b: number }
          `,
        )

        expect(generateFormattedCode(sourceFile)).resolves.toBe(
          formatWithPrettier(
            `
              export const A = <T extends TSchema>(T: T) => Type.Object({
                a: T
              });

              export type A<T extends TSchema> = Static<ReturnType<typeof A<T>>>;

              export const B = Type.Composite([A(Type.Number()), Type.Object({
                b: Type.Number()
              })]);

              export type B = Static<typeof B>;
            `,
            true,
            true,
          ),
        )
      })

      test('generic types extension', () => {
        const sourceFile = createSourceFile(
          project,
          `
            interface A<T> { a: T }
            interface B<T> extends A<T> { b: T }
          `,
        )

        expect(generateFormattedCode(sourceFile)).resolves.toBe(
          formatWithPrettier(
            `
              export const A = <T extends TSchema>(T: T) => Type.Object({
                a: T
              });

              export type A<T extends TSchema> = Static<ReturnType<typeof A<T>>>;

              export const B = <T extends TSchema>(T: T) => Type.Composite([A(T), Type.Object({
                b: T
              })]);

              export type B<T extends TSchema> = Static<ReturnType<typeof B<T>>>;
            `,
            true,
            true,
          ),
        )
      })

      test('generic types with extended type', () => {
        const sourceFile = createSourceFile(
          project,
          `
            declare const A: readonly ["a", "b"]
            type A = typeof A[number]
            interface B<T extends A> { a: T }
            type C = B<'a'>
            type D = B<'b'>
          `,
        )

        expect(generateFormattedCode(sourceFile)).resolves.toBe(
          formatWithPrettier(
            `
              export const A = Type.Union([Type.Literal('a'), Type.Literal('b')])

              export type A = Static<typeof A>

              export const B = <T extends TSchema>(T: T) => Type.Object({
                a: T
              })

              export type B<T extends TSchema> = Static<ReturnType<typeof B<T>>>

              export const C = B(Type.Literal('a'))

              export type C = Static<typeof C>

              export const D = B(Type.Literal('b'))

              export type D = Static<typeof D>
            `,
            true,
            true,
          ),
        )
      })
    })
  })
})
