export type TSConfigInput =
  | string
  | { toString(): string }
  | {
      compilerOptions?: {
        verbatimModuleSyntax?: boolean
        [key: string]: unknown
      }
      [key: string]: unknown
    }

export type TSConfigResult = {
  verbatimModuleSyntax: boolean
  [key: string]: unknown
}

export const loadTSConfig = async (input: TSConfigInput): Promise<TSConfigResult> => {
  if (typeof input === 'string') {
    return await loadTSConfigFromFile(input)
  }

  if (typeof input === 'object' && input !== null) {
    // Check if it's a URL-like object (has toString method and no TSConfig properties)
    if (
      'toString' in input &&
      typeof input.toString === 'function' &&
      !('compilerOptions' in input) &&
      !('extends' in input) &&
      !('include' in input) &&
      !('exclude' in input)
    ) {
      // Additional check: if it's a plain object with only toString, treat as URL-like
      const keys = Object.keys(input)
      if (keys.length === 1 && keys[0] === 'toString') {
        const filePath = input.toString()
        return await loadTSConfigFromFile(filePath)
      }
    }

    // Otherwise treat as TSConfig object
    return processTSConfigObject(input)
  }

  throw new Error('Invalid TSConfig input type')
}

const loadTSConfigFromFile = async (filePath: string): Promise<TSConfigResult> => {
  try {
    const file = Bun.file(filePath)
    const content = await file.text()
    const tsConfigObject = JSON.parse(content) as Record<string, unknown>
    return processTSConfigObject(tsConfigObject)
  } catch (error) {
    throw new Error(`TSConfig loading failed: ${filePath} Reason: ${error}`)
  }
}

const processTSConfigObject = (tsConfig: Record<string, unknown>): TSConfigResult => {
  const compilerOptions = (tsConfig.compilerOptions as Record<string, unknown>) || {}
  const verbatimModuleSyntax = compilerOptions.verbatimModuleSyntax === true

  return {
    verbatimModuleSyntax,
    ...compilerOptions,
  }
}
