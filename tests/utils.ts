import { generateCode } from '@daxserver/validation-schema-codegen/ts-morph-codegen'
import synchronizedPrettier from '@prettier/sync'
import { Project, SourceFile } from 'ts-morph'

const prettierOptions = { parser: 'typescript' as const }
const typeboxImport = (tschema: string = '') =>
  `import { Type, type Static${tschema} } from "@sinclair/typebox";\n`
const typeboxImportTSchema = () => typeboxImport(', type TSchema')

export const createSourceFile = (project: Project, code: string, filePath: string = 'test.ts') => {
  return project.createSourceFile(filePath, code)
}

export const formatWithPrettier = (
  input: string,
  addImport: boolean = true,
  tschema: boolean = false,
): string => {
  const importTypebox = tschema ? typeboxImportTSchema() : typeboxImport()
  const code = addImport ? `${importTypebox}${input}` : input

  return synchronizedPrettier.format(code, prettierOptions)
}

export const generateFormattedCode = async (
  sourceFile: SourceFile,
  exportEverything: boolean = false,
  tschema: boolean = false,
): Promise<string> => {
  const code = await generateCode({
    sourceCode: sourceFile.getFullText(),
    exportEverything,
    callerFile: sourceFile.getFilePath(),
    project: sourceFile.getProject(),
  })

  return formatWithPrettier(code, false, tschema)
}
