import { beforeEach, describe, expect, it } from 'bun:test'
import { Project } from 'ts-morph'
import { formatWithPrettier } from './utils'
import { generateCode } from '../../src/ts-morph-codegen'

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
      const expected = formatWithPrettier(`
      export const MyType = Type.String();

      export type MyType = Static<typeof MyType>;
      export enum MyEnum { A, B, C = 'c' }

      export const MyEnum = Type.Enum(MyEnum);

      export type MyEnum = Static<typeof MyEnum>;
    `)
      const result = formatWithPrettier(generateCode(sourceFile, { exportEverything: true }), false)
      expect(result).toBe(expected)
    })

    it('should export imported types', () => {
      const input = `
      import { ImportedType } from './utils';
      type MyType = ImportedType;
      type LocalType = string;
    `
      project.createSourceFile('utils.ts', 'export type ImportedType = string;')
      const sourceFile = project.createSourceFile('test.ts', input)
      const expected = formatWithPrettier(`
      export const ImportedType = Type.String();

      export type ImportedType = Static<typeof ImportedType>;

      export const MyType = ImportedType;

      export type MyType = Static<typeof MyType>;

      export const LocalType = Type.String();

      export type LocalType = Static<typeof LocalType>;
    `)
      const result = formatWithPrettier(generateCode(sourceFile, { exportEverything: true }), false)
      expect(result).toBe(expected)
    })

    it('should export unused imported types', () => {
      const input = `
      import { UnusedImportedType } from './unused-utils';
      type MyType = string;
    `
      project.createSourceFile('unused-utils.ts', 'export type UnusedImportedType = number;')
      const sourceFile = project.createSourceFile('test.ts', input)
      const expected = formatWithPrettier(`
      export const UnusedImportedType = Type.Number();

      export type UnusedImportedType = Static<typeof UnusedImportedType>;

      export const MyType = Type.String();

      export type MyType = Static<typeof MyType>;
    `)
      const result = formatWithPrettier(generateCode(sourceFile, { exportEverything: true }), false)
      expect(result).toBe(expected)
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
      const expected = formatWithPrettier(`
      const MyType = Type.String();

      type MyType = Static<typeof MyType>;
      enum MyEnum {
        A,
        B,
        C = 'c',
      }

      const MyEnum = Type.Enum(MyEnum);

      type MyEnum = Static<typeof MyEnum>;
    `)
      const result = formatWithPrettier(
        generateCode(sourceFile, { exportEverything: false }),
        false,
      )
      expect(result).toBe(expected)
    })

    it('should not export imported types', () => {
      const input = `
      import { ImportedType } from './utils';
      type MyType = ImportedType;
      type LocalType = string;
    `
      project.createSourceFile('utils.ts', 'export type ImportedType = string;')
      const sourceFile = project.createSourceFile('test.ts', input)
      const expected = formatWithPrettier(`
      const ImportedType = Type.String();

      type ImportedType = Static<typeof ImportedType>;

      const MyType = ImportedType;

      type MyType = Static<typeof MyType>;

      const LocalType = Type.String();

      type LocalType = Static<typeof LocalType>;
    `)
      const result = formatWithPrettier(
        generateCode(sourceFile, { exportEverything: false }),
        false,
      )
      expect(result).toBe(expected)
    })

    it('should not export unused imported types', () => {
      const input = `
      import { UnusedImportedType } from './unused-utils';
      export type MyType = string;
    `
      project.createSourceFile('unused-utils.ts', 'export type UnusedImportedType = number;')
      const sourceFile = project.createSourceFile('test.ts', input)
      const expected = formatWithPrettier(`
      export const MyType = Type.String();

      export type MyType = Static<typeof MyType>;
    `)
      const result = formatWithPrettier(generateCode(sourceFile), false)
      expect(result).toBe(expected)
    })
  })
})
