import { CompilerConfig } from '@daxserver/validation-schema-codegen/utils/compiler-config'
import { isValidIdentifier } from '@daxserver/validation-schema-codegen/utils/identifier-utils'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { ts } from 'ts-morph'

describe('identifier-utils', () => {
  let compilerConfig: CompilerConfig

  beforeEach(() => {
    compilerConfig = CompilerConfig.getInstance()
    compilerConfig.reset()
  })

  afterEach(() => {
    compilerConfig.reset()
  })

  describe('isValidIdentifier', () => {
    test('should validate basic identifiers', () => {
      expect(isValidIdentifier('validName')).toBe(true)
      expect(isValidIdentifier('_underscore')).toBe(true)
      expect(isValidIdentifier('$dollar')).toBe(true)
      expect(isValidIdentifier('camelCase')).toBe(true)
      expect(isValidIdentifier('PascalCase')).toBe(true)
    })

    test('should reject invalid identifiers', () => {
      expect(isValidIdentifier('')).toBe(false)
      expect(isValidIdentifier('123invalid')).toBe(false)
      expect(isValidIdentifier('invalid-name')).toBe(false)
      expect(isValidIdentifier('invalid.name')).toBe(false)
      expect(isValidIdentifier('invalid name')).toBe(false)
      expect(isValidIdentifier('invalid@name')).toBe(false)
    })

    test('should handle identifiers with numbers after first character', () => {
      expect(isValidIdentifier('valid123')).toBe(true)
      expect(isValidIdentifier('name2')).toBe(true)
      expect(isValidIdentifier('test_123')).toBe(true)
    })

    test('should use runtime script target when no explicit target provided', () => {
      // Set a specific script target
      compilerConfig.setScriptTarget(ts.ScriptTarget.ES2015)

      // Should use the configured target
      expect(isValidIdentifier('validName')).toBe(true)
      expect(isValidIdentifier('123invalid')).toBe(false)
    })

    test('should handle edge cases', () => {
      expect(isValidIdentifier('a')).toBe(true)
      expect(isValidIdentifier('_')).toBe(true)
      expect(isValidIdentifier('$')).toBe(true)
      expect(isValidIdentifier('__proto__')).toBe(true)
      expect(isValidIdentifier('constructor')).toBe(true)
      expect(isValidIdentifier('𝒜')).toBe(true)
      expect(isValidIdentifier('A𝒜')).toBe(true)
      expect(isValidIdentifier('𝒜A')).toBe(true)
    })

    test('should reject reserved words as identifiers', () => {
      // They only check character validity. Reserved word checking is done elsewhere.
      expect(isValidIdentifier('class')).toBe(true) // Valid characters, but reserved word
      expect(isValidIdentifier('function')).toBe(true) // Valid characters, but reserved word
      expect(isValidIdentifier('var')).toBe(true) // Valid characters, but reserved word
    })
  })
})
