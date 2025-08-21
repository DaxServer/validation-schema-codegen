import { existsSync, statSync } from 'fs'
import { dirname, isAbsolute, resolve } from 'path'
import { Project, SourceFile } from 'ts-morph'

export interface InputOptions {
  filePath?: string
  sourceCode?: string
  callerFile?: string
  project?: Project
}

const hasRelativeImports = (code: string): boolean => {
  const relativeImportRegex = /import\s+.*?from\s+['"]\.[^'"]*['"]/g
  return relativeImportRegex.test(code)
}

const resolveFilePath = (input: string, callerFile?: string): string => {
  if (isAbsolute(input)) {
    if (!existsSync(input)) {
      throw new Error(`Absolute path does not exist: ${input}`)
    }
    return input
  }

  const possiblePaths: string[] = []

  if (callerFile) {
    const callerDir = dirname(callerFile)
    possiblePaths.push(resolve(callerDir, input))
  }

  possiblePaths.push(resolve(process.cwd(), input))

  const existingPaths = possiblePaths.filter((path) => existsSync(path))

  if (existingPaths.length === 0) {
    throw new Error(`Could not resolve path: ${input}. Tried: ${possiblePaths.join(', ')}`)
  }

  if (existingPaths.length > 1) {
    throw new Error(
      `Multiple resolutions found for path: ${input}. Found: ${existingPaths.join(', ')}. Please provide a more specific path.`,
    )
  }

  return existingPaths[0]!
}

const validateInputOptions = (options: InputOptions): void => {
  const { filePath, sourceCode } = options

  if (!filePath && !sourceCode) {
    throw new Error('Either filePath or sourceCode must be provided')
  }

  if (filePath && sourceCode) {
    throw new Error('Only one of filePath or sourceCode can be provided, not both')
  }
}

export const createSourceFileFromInput = (options: InputOptions): SourceFile => {
  validateInputOptions(options)

  const project = options.project || new Project()
  const { filePath, sourceCode, callerFile } = options

  if (sourceCode) {
    // If callerFile is provided, it means this code came from an existing SourceFile
    // and relative imports should be allowed
    if (hasRelativeImports(sourceCode) && !callerFile) {
      throw new Error(
        'Relative imports are not supported when providing code as string. Only package imports from node_modules are allowed. Relative imports will be implemented in the future.',
      )
    }

    return project.createSourceFile('temp.ts', sourceCode)
  }

  if (filePath) {
    const resolvedPath = resolveFilePath(filePath, callerFile)

    if (!statSync(resolvedPath).isFile()) {
      throw new Error(`Path is not a file: ${resolvedPath}`)
    }

    return project.addSourceFileAtPath(resolvedPath)
  }

  throw new Error('Invalid input options')
}
