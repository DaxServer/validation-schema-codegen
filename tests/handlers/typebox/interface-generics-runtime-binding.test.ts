import { createSourceFile, formatWithPrettier, generateFormattedCode } from '@test-fixtures/utils'
import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

describe('Interface Generic Runtime Binding', () => {
  let project: Project

  beforeEach(() => {
    project = new Project()
  })

  test('generic interface with single generic type', () => {
    const sourceFile = createSourceFile(
      project,
      `
        interface Container<T> {
          value: T;
        }
      `,
    )

    expect(generateFormattedCode(sourceFile, true)).toBe(
      formatWithPrettier(
        `
          export const Container = <T extends TSchema>(T: T) => Type.Object({
            value: T,
          });

          export type Container<T extends TSchema> = Static<ReturnType<typeof Container<T>>>;
        `,
        true,
        true,
      ),
    )
  })

  test('generic interface with multiple type parameters', () => {
    const sourceFile = createSourceFile(
      project,
      `
        interface Response<T, E> {
          data: T;
          error: E;
        }
      `,
    )

    expect(generateFormattedCode(sourceFile, true)).toBe(
      formatWithPrettier(
        `
          export const Response = <T extends TSchema, E extends TSchema>(T: T, E: E) => Type.Object({
            data: T,
            error: E,
          });

          export type Response<T extends TSchema, E extends TSchema> = Static<ReturnType<typeof Response<T, E>>>;
        `,
        true,
        true,
      ),
    )
  })

  test('generic interface with multiple generics and non-generics', () => {
    const sourceFile = createSourceFile(
      project,
      `
        interface GenericContainer<T, U> {
          first: T;
          second: U;
          metadata: {
            created: string;
            updated: string;
          };
        }
      `,
    )

    expect(generateFormattedCode(sourceFile, true)).toBe(
      formatWithPrettier(
        `
          export const GenericContainer = <T extends TSchema, U extends TSchema>(T: T, U: U) => Type.Object({
            first: T,
            second: U,
            metadata: Type.Object({
              created: Type.String(),
              updated: Type.String(),
            }),
          });

          export type GenericContainer<T extends TSchema, U extends TSchema> = Static<ReturnType<typeof GenericContainer<T, U>>>;
        `,
        true,
        true,
      ),
    )
  })
})
