import {
  createSourceFile,
  formatWithPrettier,
  generateFormattedCode,
} from '@test-fixtures/ts-morph/utils'
import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

describe('Enum types', () => {
  let project: Project

  beforeEach(() => {
    project = new Project()
  })

  describe('without export', () => {
    test('only enum', () => {
      const sourceFile = createSourceFile(
        project,
        `enum A {
      B,
      C,
    }
    `,
      )

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`enum A {
        B,
        C,
      }

      const A = Type.Enum(A);

      type A = Static<typeof A>;
    `),
      )
    })

    test('enum with values', () => {
      const sourceFile = createSourceFile(
        project,
        `enum A {
        B = 'b',
        C = 'c',
      }
      `,
      )

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`enum A {
        B = 'b',
        C = 'c',
      }

      const A = Type.Enum(A);

      type A = Static<typeof A>;
    `),
      )
    })
  })

  describe('with export', () => {
    test('only enum', () => {
      const sourceFile = createSourceFile(
        project,
        `export enum A {
      B,
      C,
    }
    `,
      )

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`export enum A {
        B,
        C,
      }

      export const A = Type.Enum(A);

      export type A = Static<typeof A>;
    `),
      )
    })

    test('enum with values', () => {
      const sourceFile = createSourceFile(
        project,
        `export enum A {
        B = 'b',
        C = 'c',
      }
      `,
      )

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`export enum A {
        B = 'b',
        C = 'c',
      }

      export const A = Type.Enum(A);

      export type A = Static<typeof A>;
    `),
      )
    })
  })
})
