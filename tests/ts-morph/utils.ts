import { Project, SourceFile } from 'ts-morph'
import synchronizedPrettier from '@prettier/sync'
import { generateCode } from '../../src/ts-morph-codegen'

const prettierOptions = { parser: 'typescript' as const }
const typeboxImport = `import { Type } from "@sinclair/typebox";
import { type Static } from "@sinclair/typebox";
`

export const createSourceFile = (project: Project, code: string, filePath: string = 'test.ts') => {
  return project.createSourceFile(filePath, code)
}

export const formatWithPrettier = (input: string, addImport: boolean = true): string => {
  const code = addImport ? `${typeboxImport}${input}` : input
  return synchronizedPrettier.format(code, prettierOptions)
}

export const generateFormattedCode = async (
  sourceFile: SourceFile,
  exportEverything: boolean = false,
): Promise<string> => {
  const code = await generateCode(sourceFile, { exportEverything })
  return formatWithPrettier(code, false)
}
