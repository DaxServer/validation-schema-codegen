import { createSourceFile, formatWithPrettier, generateFormattedCode } from '@test-fixtures/utils'
import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

describe('Interface Generic Consistency with Type Aliases', () => {
  let project: Project

  beforeEach(() => {
    project = new Project()
  })

  test('interface and type alias should generate identical patterns for generics', () => {
    // Test that both interface and type alias generate the same arrow function pattern
    const interfaceSource = createSourceFile(
      project,
      `
        interface Container<T> {
          value: T;
          id: string;
        }
      `,
    )

    const typeAliasSource = createSourceFile(
      project,
      `
        type Container<T> = {
          value: T;
          id: string;
        }
      `,
      'type-alias.ts',
    )

    const interfaceResult = generateFormattedCode(interfaceSource, true)
    const typeAliasResult = generateFormattedCode(typeAliasSource, true)

    // Both should generate the same arrow function pattern
    const expectedPattern = formatWithPrettier(
      `
        export const Container = <T extends TSchema>(T: T) => Type.Object({
          value: T,
          id: Type.String(),
        });

        export type Container<T extends TSchema> = Static<ReturnType<typeof Container<T>>>;
      `,
      true,
      true,
    )

    expect(interfaceResult).toBe(expectedPattern)
    expect(typeAliasResult).toBe(expectedPattern)
  })

  test('complex generic interface should use GenericTypeUtils flow', () => {
    // This test is designed to fail if the interface parser doesn't use
    // the same GenericTypeUtils.createGenericArrowFunction flow as type aliases
    const sourceFile = createSourceFile(
      project,
      `
        interface ApiResponse<T, E> {
          data: T;
          error: E;
          status: number;
          metadata: {
            timestamp: string;
            version: number;
          };
        }
      `,
    )

    const result = generateFormattedCode(sourceFile, true)

    // Should generate using the same pattern as type aliases
    expect(result).toBe(
      formatWithPrettier(
        `
          export const ApiResponse = <T extends TSchema, E extends TSchema>(T: T, E: E) => Type.Object({
            data: T,
            error: E,
            status: Type.Number(),
            metadata: Type.Object({
              timestamp: Type.String(),
              version: Type.Number(),
            }),
          });

          export type ApiResponse<T extends TSchema, E extends TSchema> = Static<ReturnType<typeof ApiResponse<T, E>>>;
        `,
        true,
        true,
      ),
    )
  })
})
