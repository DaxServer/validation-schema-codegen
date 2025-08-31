import { describe, expect, beforeEach, afterEach, test } from 'bun:test'
import { Project, ts } from 'ts-morph'
import { CompilerConfig, getScriptTarget, initializeCompilerConfig } from '@daxserver/validation-schema-codegen/utils/compiler-config'

describe('compiler-config', () => {
  let compilerConfig: CompilerConfig

  beforeEach(() => {
    compilerConfig = CompilerConfig.getInstance()
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

    test('should have default script target', () => {
      expect(compilerConfig.getScriptTarget()).toBe(ts.ScriptTarget.Latest)
    })

    test('should allow setting script target explicitly', () => {
      compilerConfig.setScriptTarget(ts.ScriptTarget.ES2015)
      expect(compilerConfig.getScriptTarget()).toBe(ts.ScriptTarget.ES2015)

      compilerConfig.setScriptTarget(ts.ScriptTarget.ES5)
      expect(compilerConfig.getScriptTarget()).toBe(ts.ScriptTarget.ES5)
    })

    test('should reset to defaults', () => {
      compilerConfig.setScriptTarget(ts.ScriptTarget.ES5)
      expect(compilerConfig.getScriptTarget()).toBe(ts.ScriptTarget.ES5)

      compilerConfig.reset()
      expect(compilerConfig.getScriptTarget()).toBe(ts.ScriptTarget.Latest)
    })

    test('should initialize from compiler options with explicit target', () => {
      const compilerOptions: ts.CompilerOptions = {
        target: ts.ScriptTarget.ES2015
      }

      compilerConfig.initializeFromCompilerOptions(compilerOptions)
      expect(compilerConfig.getScriptTarget()).toBe(ts.ScriptTarget.ES2015)
    })

    test('should use default target when compiler options have no target', () => {
      const compilerOptions: ts.CompilerOptions = {}

      compilerConfig.initializeFromCompilerOptions(compilerOptions)
      expect(compilerConfig.getScriptTarget()).toBe(ts.ScriptTarget.Latest)
    })

    test('should initialize from ts-morph Project', () => {
      const project = new Project({
        compilerOptions: {
          target: ts.ScriptTarget.ES2020
        }
      })

      compilerConfig.initializeFromProject(project)
      expect(compilerConfig.getScriptTarget()).toBe(ts.ScriptTarget.ES2020)
    })

    test('should handle Project with no explicit compiler options', () => {
      const project = new Project()

      compilerConfig.initializeFromProject(project)
      // Should use default
      expect(compilerConfig.getScriptTarget()).toBe(ts.ScriptTarget.Latest)
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
          target: ts.ScriptTarget.ES2017
        }
      })

      initializeCompilerConfig(project)
      expect(getScriptTarget()).toBe(ts.ScriptTarget.ES2017)
    })
  })
})
