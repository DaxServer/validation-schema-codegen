import { Project, ts } from 'ts-morph'

/**
 * Detects the appropriate TypeScript ScriptTarget based on the environment's TypeScript version
 */
const detectEnvironmentScriptTarget = (): ts.ScriptTarget => {
  // Get TypeScript version from the environment
  const [major, minor] = ts.version.split('.').map(Number)

  // Ensure we have valid version numbers
  if (typeof major !== 'number' || typeof minor !== 'number' || isNaN(major) || isNaN(minor)) {
    return ts.ScriptTarget.ES2020
  }

  // Map TypeScript versions to appropriate ScriptTarget values
  // Based on TypeScript release history and ECMAScript support
  if (major >= 5) {
    if (minor >= 2) return ts.ScriptTarget.ES2023
    if (minor >= 0) return ts.ScriptTarget.ES2022
  }

  if (major >= 4) {
    if (minor >= 9) return ts.ScriptTarget.ES2022
    if (minor >= 7) return ts.ScriptTarget.ES2021
    if (minor >= 5) return ts.ScriptTarget.ES2020
    if (minor >= 2) return ts.ScriptTarget.ES2019
    if (minor >= 1) return ts.ScriptTarget.ES2018
    return ts.ScriptTarget.ES2017
  }

  if (major >= 3) {
    if (minor >= 8) return ts.ScriptTarget.ES2017
    if (minor >= 6) return ts.ScriptTarget.ES2016
    if (minor >= 4) return ts.ScriptTarget.ES2015
    return ts.ScriptTarget.ES5
  }

  // Fallback for older versions
  return ts.ScriptTarget.ES5
}

/**
 * Configuration utility for managing TypeScript compiler options and script targets
 */
export class CompilerConfig {
  private static instance: CompilerConfig | null = null
  private scriptTarget: ts.ScriptTarget

  private constructor() {
    // Private constructor to prevent instantiation
    // Initialize with environment-detected target
    this.scriptTarget = detectEnvironmentScriptTarget()
  }

  /**
   * Gets the singleton instance of CompilerConfig
   */
  static getInstance(): CompilerConfig {
    if (!CompilerConfig.instance) {
      CompilerConfig.instance = new CompilerConfig()
    }
    return CompilerConfig.instance
  }

  /**
   * Initializes the compiler configuration from a ts-morph Project
   */
  initializeFromProject(project: Project): void {
    this.scriptTarget = project.getCompilerOptions().target ?? detectEnvironmentScriptTarget()
  }

  /**
   * Gets the current script target
   */
  getScriptTarget(): ts.ScriptTarget {
    return this.scriptTarget
  }

  /**
   * Sets the script target explicitly
   */
  setScriptTarget(target: ts.ScriptTarget): void {
    this.scriptTarget = target
  }

  /**
   * Resets the configuration to defaults
   */
  reset(): void {
    this.scriptTarget = detectEnvironmentScriptTarget()
  }
}

/**
 * Convenience function to get the current script target
 */
export const getScriptTarget = (): ts.ScriptTarget => {
  return CompilerConfig.getInstance().getScriptTarget()
}

/**
 * Convenience function to initialize compiler config from a project
 */
export const initializeCompilerConfig = (project: Project): void => {
  CompilerConfig.getInstance().initializeFromProject(project)
}
