import { createSourceFile, formatWithPrettier, generateFormattedCode } from '@test-fixtures/utils'
import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

describe('generic types', () => {
  let project: Project

  beforeEach(() => {
    project = new Project()
  })

  test('generic types', () => {
    const sourceFile = createSourceFile(
      project,
      `
        interface A<T> { a: T }
        interface B extends A<number> { b: number }
      `,
    )

    expect(generateFormattedCode(sourceFile)).toBe(
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

    expect(generateFormattedCode(sourceFile)).toBe(
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

    expect(generateFormattedCode(sourceFile)).toBe(
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

  test('generics with complexity', () => {
    const sourceFile = createSourceFile(
      project,
      `
        export type LanguageCode = string;
        type LanguageRecord<V> = Partial<Readonly<Record<LanguageCode, V>>>;
      `,
    )

    expect(generateFormattedCode(sourceFile)).toBe(
      formatWithPrettier(
        `
          export const LanguageCode = Type.String()

          export type LanguageCode = Static<typeof LanguageCode>

          export const LanguageRecord = <V extends TSchema>(V: V) => Type.Partial(Type.Readonly(Type.Record(LanguageCode, V)))

          export type LanguageRecord<V extends TSchema> = Static<ReturnType<typeof LanguageRecord<V>>>
        `,
        true,
        true,
      ),
    )
  })

  test('multiple generic parameters with constraints', () => {
    const sourceFile = createSourceFile(
      project,
      `
        type ApiResponse<T, E> = {
          data?: T;
          error?: E;
          status: number;
        };
        type UserResponse<T> = ApiResponse<T, string>;
      `,
    )

    expect(generateFormattedCode(sourceFile)).toBe(
      formatWithPrettier(
        `
          export const ApiResponse = <T extends TSchema, E extends TSchema>(T: T, E: E) => Type.Object({
            data: Type.Optional(T),
            error: Type.Optional(E),
            status: Type.Number()
          })

          export type ApiResponse<T extends TSchema, E extends TSchema> = Static<ReturnType<typeof ApiResponse<T, E>>>

          export const UserResponse = <T extends TSchema>(T: T) => ApiResponse(T, Type.String())

          export type UserResponse<T extends TSchema> = Static<ReturnType<typeof UserResponse<T>>>
        `,
        true,
        true,
      ),
    )
  })
})
