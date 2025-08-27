import { formatWithPrettier, generateFormattedCode } from '@test-fixtures/utils'
import { beforeEach, describe, expect, it } from 'bun:test'
import { Project } from 'ts-morph'

describe('exportEverything flag', () => {
  let project: Project

  beforeEach(() => {
    project = new Project()
  })

  describe('export everything is true', () => {
    it('should export all declarations', () => {
      const sourceFile = project.createSourceFile(
        'test.ts',
        `
          type MyType = string;
          enum MyEnum { A, B, C = 'c' }
        `,
      )

      expect(generateFormattedCode(sourceFile, true)).resolves.toBe(
        formatWithPrettier(`
          export const MyType = Type.String();

          export type MyType = Static<typeof MyType>;
          export enum MyEnum { A, B, C = 'c' }

          export const MyEnum = Type.Enum(MyEnum);

          export type MyEnum = Static<typeof MyEnum>;
        `),
      )
    })

    it('should export imported types', () => {
      project.createSourceFile('utils.ts', 'export type ImportedType = string;')
      const sourceFile = project.createSourceFile(
        'test.ts',
        `
          import { ImportedType } from './utils';
          type MyType = ImportedType;
          type LocalType = string;
        `,
      )

      expect(generateFormattedCode(sourceFile, true)).resolves.toBe(
        formatWithPrettier(`
          export const ImportedType = Type.String();

          export type ImportedType = Static<typeof ImportedType>;

          export const MyType = ImportedType;

          export type MyType = Static<typeof MyType>;

          export const LocalType = Type.String();

          export type LocalType = Static<typeof LocalType>;
        `),
      )
    })

    it('should export unused imported types', () => {
      project.createSourceFile('unused-utils.ts', 'export type UnusedImportedType = number;')
      const sourceFile = project.createSourceFile(
        'test.ts',
        `
          import { UnusedImportedType } from './unused-utils';
          type MyType = string;
        `,
      )

      expect(generateFormattedCode(sourceFile, true)).resolves.toBe(
        formatWithPrettier(`
          export const UnusedImportedType = Type.Number();

          export type UnusedImportedType = Static<typeof UnusedImportedType>;

          export const MyType = Type.String();

          export type MyType = Static<typeof MyType>;
        `),
      )
    })
  })

  describe('export everything is false', () => {
    it('should only export processed declarations', () => {
      const sourceFile = project.createSourceFile(
        'test.ts',
        `
          type MyType = string;

          enum MyEnum {
            A,
            B,
            C = 'c',
          }
        `,
      )

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          const MyType = Type.String();

          type MyType = Static<typeof MyType>;
          enum MyEnum {
            A,
            B,
            C = 'c',
          }

          const MyEnum = Type.Enum(MyEnum);

          type MyEnum = Static<typeof MyEnum>;
        `),
      )
    })

    it('should not export imported types', () => {
      project.createSourceFile('utils.ts', 'export type ImportedType = string;')
      const sourceFile = project.createSourceFile(
        'test.ts',
        `
          import { ImportedType } from './utils';
          type MyType = ImportedType;
          type LocalType = string;
        `,
      )

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          const ImportedType = Type.String();

          type ImportedType = Static<typeof ImportedType>;

          const MyType = ImportedType;

          type MyType = Static<typeof MyType>;

          const LocalType = Type.String();

          type LocalType = Static<typeof LocalType>;
        `),
      )
    })

    it('should not export unused imported types', () => {
      project.createSourceFile('unused-utils.ts', 'export type UnusedImportedType = number;')
      const sourceFile = project.createSourceFile(
        'test.ts',
        `
          import { UnusedImportedType } from './unused-utils';
          export type MyType = string;
        `,
      )

      expect(generateFormattedCode(sourceFile)).resolves.toBe(
        formatWithPrettier(`
          export const MyType = Type.String();

          export type MyType = Static<typeof MyType>;
        `),
      )
    })
  })
})
