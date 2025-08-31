import {
  CompilerConfig,
  getScriptTarget,
  initializeCompilerConfig,
} from '@daxserver/validation-schema-codegen/utils/compiler-config'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { Project, ts } from 'ts-morph'

describe('compiler-config', () => {
  const compilerConfig = CompilerConfig.getInstance()

  beforeEach(() => {
    compilerConfig.reset()
  })

  afterEach(() => {
    compilerConfig.reset()
  })

  describe('CompilerConfig', () => {
    test('should be a singleton', () => {
      const instance1 = CompilerConfig.getInstance()
      const instance2 = CompilerConfig.getInstance()
      expect(instance1).toBe(instance2)
    })

    test('should have environment-detected script target as default', () => {
      // Should detect target based on TypeScript version, not use Latest
      const target = compilerConfig.getScriptTarget()
      expect(target).not.toBe(ts.ScriptTarget.Latest)
      expect(target).toBeGreaterThanOrEqual(ts.ScriptTarget.ES5)
      expect(target).toBeLessThan(ts.ScriptTarget.Latest)
    })

    test('should allow setting script target explicitly', () => {
      compilerConfig.setScriptTarget(ts.ScriptTarget.ES2015)
      expect(compilerConfig.getScriptTarget()).toBe(ts.ScriptTarget.ES2015)

      compilerConfig.setScriptTarget(ts.ScriptTarget.ES5)
      expect(compilerConfig.getScriptTarget()).toBe(ts.ScriptTarget.ES5)
    })

    test('should reset to environment-detected defaults', () => {
      const originalTarget = compilerConfig.getScriptTarget()
      compilerConfig.setScriptTarget(ts.ScriptTarget.ES5)
      expect(compilerConfig.getScriptTarget()).toBe(ts.ScriptTarget.ES5)

      compilerConfig.reset()
      expect(compilerConfig.getScriptTarget()).toBe(originalTarget)
      expect(compilerConfig.getScriptTarget()).not.toBe(ts.ScriptTarget.Latest)
    })

    test('should initialize from ts-morph Project', () => {
      const project = new Project({
        compilerOptions: {
          target: ts.ScriptTarget.ES2020,
        },
      })

      compilerConfig.initializeFromProject(project)
      expect(compilerConfig.getScriptTarget()).toBe(ts.ScriptTarget.ES2020)
    })

    test('should handle Project with no explicit compiler options', () => {
      const project = new Project()

      compilerConfig.initializeFromProject(project)
      // Should use environment-detected target, not Latest
      const target = compilerConfig.getScriptTarget()
      expect(target).not.toBe(ts.ScriptTarget.Latest)
      expect(target).toBeGreaterThanOrEqual(ts.ScriptTarget.ES5)
      expect(target).toBeLessThan(ts.ScriptTarget.Latest)
    })
  })

  describe('environment detection', () => {
    test('should detect appropriate target based on TypeScript version', () => {
      const target = compilerConfig.getScriptTarget()

      // For TypeScript 5.9.2, should detect ES2023 or higher
      expect(target).toBeGreaterThanOrEqual(ts.ScriptTarget.ES2020)
      expect(target).toBeLessThan(ts.ScriptTarget.Latest)
    })

    test('should use environment target when project has no explicit options', () => {
      const project = new Project()
      const originalTarget = compilerConfig.getScriptTarget()

      // Set to a different target first
      compilerConfig.setScriptTarget(ts.ScriptTarget.ES5)

      // Initialize from project should use environment target
      compilerConfig.initializeFromProject(project)
      expect(compilerConfig.getScriptTarget()).toBe(originalTarget)
    })
  })

  describe('convenience functions', () => {
    test('getScriptTarget should return current script target', () => {
      compilerConfig.setScriptTarget(ts.ScriptTarget.ES2018)
      expect(getScriptTarget()).toBe(ts.ScriptTarget.ES2018)
    })

    test('initializeCompilerConfig should initialize from project', () => {
      const project = new Project({
        compilerOptions: {
          target: ts.ScriptTarget.ES2017,
        },
      })

      initializeCompilerConfig(project)
      expect(getScriptTarget()).toBe(ts.ScriptTarget.ES2017)
    })
  })
})
