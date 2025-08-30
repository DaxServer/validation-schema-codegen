import { createSourceFile, formatWithPrettier, generateFormattedCode } from '@test-fixtures/utils'
import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

describe('Interface Generic Runtime Binding', () => {
  let project: Project

  beforeEach(() => {
    project = new Project()
  })

  test('generic interface should generate arrow function wrapper for runtime bindings', () => {
    const sourceFile = createSourceFile(
      project,
      `
        interface Container<T> {
          value: T;
          id: string;
        }
      `,
    )

    const result = generateFormattedCode(sourceFile, true)

    // The generated code should be an arrow function that takes type parameters
    // and returns the TypeBox expression, not just the raw TypeBox expression
    expect(result).toBe(
      formatWithPrettier(
        `
          export const Container = <T extends TSchema>(T: T) => Type.Object({
            value: T,
            id: Type.String(),
          });

          export type Container<T extends TSchema> = Static<ReturnType<typeof Container<T>>>;
        `,
        true,
        true,
      ),
    )
  })

  test('generic interface with multiple type parameters should generate proper arrow function', () => {
    const sourceFile = createSourceFile(
      project,
      `
        interface Response<T, E> {
          data: T;
          error: E;
          timestamp: number;
        }
      `,
    )

    const result = generateFormattedCode(sourceFile, true)

    expect(result).toBe(
      formatWithPrettier(
        `
          export const Response = <T extends TSchema, E extends TSchema>(T: T, E: E) => Type.Object({
            data: T,
            error: E,
            timestamp: Type.Number(),
          });

          export type Response<T extends TSchema, E extends TSchema> = Static<ReturnType<typeof Response<T, E>>>;
        `,
        true,
        true,
      ),
    )
  })

  test('should fail with current implementation - demonstrates the issue', () => {
    // This test is designed to fail with the current implementation
    // to show that we need to fix the generic interface handling
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

    const result = generateFormattedCode(sourceFile, true)

    // This should generate an arrow function, but if the current implementation
    // is broken, it might generate something like:
    // export const GenericContainer = Type.Object({...})
    // instead of:
    // export const GenericContainer = <T extends TSchema, U extends TSchema>(T: T, U: U) => Type.Object({...})

    expect(result).toBe(
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
