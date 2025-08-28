import { createSourceFile, formatWithPrettier, generateFormattedCode } from '@test-fixtures/utils'
import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

describe('Enum types', () => {
  let project: Project

  beforeEach(() => {
    project = new Project()
  })

  describe('without exports', () => {
    test('only enum', () => {
      const sourceFile = createSourceFile(
        project,
        `
          enum A {
            B,
            C,
          }
        `,
      )

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(`
          export enum A {
            B,
            C,
          }

          export const ASchema = Type.Enum(A);

          export type ASchema = Static<typeof ASchema>;
        `),
      )
    })

    test('enum with values', () => {
      const sourceFile = createSourceFile(
        project,
        `
          enum A {
            B = 'b',
            C = 'c',
          }
        `,
      )

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(`
          export enum A {
            B = 'b',
            C = 'c',
          }

          export const ASchema = Type.Enum(A);

          export type ASchema = Static<typeof ASchema>;
        `),
      )
    })
  })

  describe('with exports', () => {
    test('only enum', () => {
      const sourceFile = createSourceFile(
        project,
        `
          export enum A {
            B,
            C,
          }
        `,
      )

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(`
          export enum A {
            B,
            C,
          }

          export const ASchema = Type.Enum(A);

          export type ASchema = Static<typeof ASchema>;
        `),
      )
    })

    test('enum with values', () => {
      const sourceFile = createSourceFile(
        project,
        `
          export enum A {
            B = 'b',
            C = 'c',
          }
        `,
      )

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(`
          export enum A {
            B = 'b',
            C = 'c',
          }

          export const ASchema = Type.Enum(A);

          export type ASchema = Static<typeof ASchema>;
        `),
      )
    })
  })
})
