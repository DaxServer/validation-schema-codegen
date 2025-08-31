import { Project, ts } from 'ts-morph'

/**
 * Configuration utility for managing TypeScript compiler options and script targets
 */
export class CompilerConfig {
  private static instance: CompilerConfig | null = null
  private scriptTarget: ts.ScriptTarget = ts.ScriptTarget.Latest

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
    this.scriptTarget = project.getCompilerOptions().target ?? ts.ScriptTarget.Latest
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
