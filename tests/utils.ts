import { generateCode } from '@daxserver/validation-schema-codegen'
import synchronizedPrettier from '@prettier/sync'
import { Project, SourceFile } from 'ts-morph'

const prettierOptions = { parser: 'typescript' as const }
const typeboxImport = (withTSchema: boolean) => {
  const tschema = withTSchema ? ', type TSchema' : ''

  return `import { Type, type Static${tschema} } from "@sinclair/typebox";\n`
}

export const createSourceFile = (project: Project, code: string, filePath: string = 'test.ts') => {
  return project.createSourceFile(filePath, code)
}

export const formatWithPrettier = (
  input: string,
  addImport: boolean = true,
  withTSchema: boolean = false,
): string => {
  const code = addImport ? `${typeboxImport(withTSchema)}${input}` : input

  return synchronizedPrettier.format(code, prettierOptions)
}

export const generateFormattedCode = (
  sourceFile: SourceFile,
  withTSchema: boolean = false,
): string => {
  const code = generateCode({
    sourceCode: sourceFile.getFullText(),
    callerFile: sourceFile.getFilePath(),
    project: sourceFile.getProject(),
  })

  return formatWithPrettier(code, false, withTSchema)
}
