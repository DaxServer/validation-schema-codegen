import { Project, ts } from 'ts-morph'

/**
 * Configuration utility for managing TypeScript compiler options and script targets
 */
export class CompilerConfig {
  private static instance: CompilerConfig | null = null
  private scriptTarget: ts.ScriptTarget = ts.ScriptTarget.Latest

  private constructor() {}

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
    const compilerOptions = project.getCompilerOptions()
    this.scriptTarget = this.determineScriptTarget(compilerOptions)
  }

  /**
   * Initializes the compiler configuration from TypeScript compiler options
   */
  initializeFromCompilerOptions(compilerOptions: ts.CompilerOptions): void {
    this.scriptTarget = this.determineScriptTarget(compilerOptions)
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
   * Determines the appropriate script target from compiler options
   */
  private determineScriptTarget(compilerOptions: ts.CompilerOptions): ts.ScriptTarget {
    // If target is explicitly set in compiler options, use it
    if (compilerOptions.target !== undefined) {
      return compilerOptions.target
    }

    // Default fallback based on common configurations
    // ESNext maps to Latest, ES2022+ maps to ES2022, etc.
    return ts.ScriptTarget.Latest
  }

  /**
   * Resets the configuration to defaults
   */
  reset(): void {
    this.scriptTarget = ts.ScriptTarget.Latest
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
