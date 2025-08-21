import { createSourceFileFromInput } from '@daxserver/validation-schema-codegen/input-handler'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { Project } from 'ts-morph'
import type { StandardizedFilePath } from '@ts-morph/common'

describe('Input Handler', () => {
  let tempDir: string
  let testFilePath: string

  beforeEach(() => {
    tempDir = join(process.cwd(), 'temp-test-input-handler')
    testFilePath = join(tempDir, 'test.ts')

    mkdirSync(tempDir, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  describe('hasRelativeImports detection', () => {
    test('detects relative imports with single quotes', () => {
      const code = `import { something } from './relative-path'`

      expect(() => createSourceFileFromInput({ sourceCode: code })).toThrow()
    })

    test('detects relative imports with double quotes', () => {
      const code = `import { something } from "./relative-path"`

      expect(() => createSourceFileFromInput({ sourceCode: code })).toThrow(
        'Relative imports are not supported when providing code as string'
      )
    })

    test('detects parent directory imports', () => {
      const code = `import { something } from '../parent-path'`

      expect(() => createSourceFileFromInput({ sourceCode: code })).toThrow(
        'Relative imports are not supported when providing code as string'
      )
    })

    test('detects nested relative imports', () => {
      const code = `import { something } from './nested/deep/path'`

      expect(() => createSourceFileFromInput({ sourceCode: code })).toThrow(
        'Relative imports are not supported when providing code as string'
      )
    })

    test('allows relative imports when callerFile is provided', () => {
      const code = `import { something } from './relative-path'`

      const sourceFile = createSourceFileFromInput({
        sourceCode: code,
        callerFile: '/some/caller/file.ts'
      })

      expect(sourceFile.getFullText()).toBe(code)
    })

    test('allows package imports from node_modules', () => {
      const code = `import { Type } from '@sinclair/typebox'`

      const sourceFile = createSourceFileFromInput({ sourceCode: code })

      expect(sourceFile.getFullText()).toBe(code)
    })

    test('allows multiple package imports', () => {
      const code = `
        import { Type } from '@sinclair/typebox'
        import { readFileSync } from 'fs'
        import express from 'express'
      `

      const sourceFile = createSourceFileFromInput({ sourceCode: code })

      expect(sourceFile.getFullText()).toBe(code)
    })

    test('handles mixed imports correctly', () => {
      const code = `
        import { Type } from '@sinclair/typebox'
        import { something } from './relative'
      `

      expect(() => createSourceFileFromInput({ sourceCode: code })).toThrow(
        'Relative imports are not supported when providing code as string'
      )
    })
  })

  describe('resolveFilePath function', () => {
    test('resolves absolute path that exists', () => {
      writeFileSync(testFilePath, 'export type Test = string')

      const sourceFile = createSourceFileFromInput({ filePath: testFilePath })

      expect(sourceFile.getFilePath()).toBe(testFilePath as StandardizedFilePath)
    })

    test('throws error for absolute path that does not exist', () => {
      const nonExistentPath = join(tempDir, 'non-existent.ts')

      expect(() => createSourceFileFromInput({ filePath: nonExistentPath })).toThrow(
        `Absolute path does not exist: ${nonExistentPath}`
      )
    })

    test('resolves relative path from current working directory', () => {
      const relativePath = 'temp-test-input-handler/test.ts'
      writeFileSync(testFilePath, 'export type Test = string')

      const sourceFile = createSourceFileFromInput({ filePath: relativePath })

      expect(sourceFile.getFilePath()).toBe(testFilePath as StandardizedFilePath)
    })

    test('resolves relative path from callerFile directory', () => {
      const callerFile = join(tempDir, 'caller.ts')
      const relativeFile = join(tempDir, 'relative.ts')
      writeFileSync(relativeFile, 'export type Test = string')

      const sourceFile = createSourceFileFromInput({
        filePath: './relative.ts',
        callerFile
      })

      expect(sourceFile.getFilePath()).toBe(relativeFile as StandardizedFilePath)
    })

    test('throws error when relative path cannot be resolved', () => {
      expect(() => createSourceFileFromInput({ filePath: './non-existent.ts' })).toThrow(
        'Could not resolve path: ./non-existent.ts'
      )
    })

    test('throws error when multiple resolutions found', () => {
      // Create file in current directory
      const currentDirFile = join(process.cwd(), 'duplicate.ts')
      writeFileSync(currentDirFile, 'export type Test = string')

      // Create file in caller directory
      const callerDir = join(tempDir, 'caller')
      mkdirSync(callerDir, { recursive: true })
      const callerFile = join(callerDir, 'caller.ts')
      const callerDirFile = join(callerDir, 'duplicate.ts')
      writeFileSync(callerDirFile, 'export type Test = string')

      expect(() => createSourceFileFromInput({
        filePath: './duplicate.ts',
        callerFile
      })).toThrow('Multiple resolutions found for path: ./duplicate.ts')

      // Cleanup
      rmSync(currentDirFile, { force: true })
    })

    test('throws error when path is not a file', () => {
      expect(() => createSourceFileFromInput({ filePath: tempDir })).toThrow(
        `Path is not a file: ${tempDir}`
      )
    })
  })

  describe('validateInputOptions function', () => {
    test('throws error when neither filePath nor sourceCode provided', () => {
      expect(() => createSourceFileFromInput({})).toThrow(
        'Either filePath or sourceCode must be provided'
      )
    })

    test('throws error when both filePath and sourceCode provided', () => {
      expect(() => createSourceFileFromInput({
        filePath: './test.ts',
        sourceCode: 'type Test = string'
      })).toThrow(
        'Only one of filePath or sourceCode can be provided, not both'
      )
    })

    test('accepts valid filePath option', () => {
      writeFileSync(testFilePath, 'export type Test = string')

      const sourceFile = createSourceFileFromInput({ filePath: testFilePath })

      expect(sourceFile.getFilePath()).toBe(testFilePath as StandardizedFilePath)
    })

    test('accepts valid sourceCode option', () => {
      const code = 'export type Test = string'

      const sourceFile = createSourceFileFromInput({ sourceCode: code })

      expect(sourceFile.getFullText()).toBe(code)
    })
  })

  describe('createSourceFileFromInput function', () => {
    test('creates source file from string code', () => {
      const code = 'export type Test = string'

      const sourceFile = createSourceFileFromInput({ sourceCode: code })

      expect(sourceFile.getFullText()).toBe(code)
    })

    test('creates source file from file path', () => {
      const code = 'export type Test = string'
      writeFileSync(testFilePath, code)

      const sourceFile = createSourceFileFromInput({ filePath: testFilePath })

      expect(sourceFile.getFullText()).toBe(code)
      expect(sourceFile.getFilePath()).toBe(testFilePath as StandardizedFilePath)
    })

    test('uses provided project instance', () => {
      const customProject = new Project()
      const code = 'export type Test = string'

      const sourceFile = createSourceFileFromInput({
        sourceCode: code,
        project: customProject
      })

      expect(sourceFile.getProject()).toBe(customProject)
    })

    test('creates new project when none provided', () => {
      const code = 'export type Test = string'

      const sourceFile = createSourceFileFromInput({ sourceCode: code })

      expect(sourceFile.getProject()).toBeInstanceOf(Project)
    })

    test('handles complex TypeScript code', () => {
      const code = `
        export interface User {
          id: number
          name: string
          email?: string
        }

        export type UserArray = User[]

        export enum Status {
          Active = 'active',
          Inactive = 'inactive'
        }
      `

      const sourceFile = createSourceFileFromInput({ sourceCode: code })

      expect(sourceFile.getFullText()).toBe(code)
      expect(sourceFile.getInterfaces()).toHaveLength(1)
      expect(sourceFile.getTypeAliases()).toHaveLength(1)
      expect(sourceFile.getEnums()).toHaveLength(1)
    })

    test('preserves file content when loading from disk', () => {
      const code = `
        // This is a test file
        export type Test = {
          id: number
          name: string
        }`
      writeFileSync(testFilePath, code)

      const sourceFile = createSourceFileFromInput({ filePath: testFilePath })

      expect(sourceFile.getFullText()).toBe(code)
    })
  })
})
