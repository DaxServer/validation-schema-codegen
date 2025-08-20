import { Project } from 'ts-morph'
import synchronizedPrettier from '@prettier/sync'

const prettierOptions = { parser: 'typescript' as const }
const typeboxImport = 'import { Type, Static } from "@sinclair/typebox";\n'

export const createSourceFile = (project: Project, code: string, filePath: string = 'test.ts') => {
  return project.createSourceFile(filePath, code)
}

export const formatWithPrettier = (input: string, addImport: boolean = true): string => {
  const code = addImport ? `${typeboxImport}${input}` : input
  return synchronizedPrettier.format(code, prettierOptions)
}
