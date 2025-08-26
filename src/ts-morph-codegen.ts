import {
  createSourceFileFromInput,
  type InputOptions,
} from '@daxserver/validation-schema-codegen/input-handler'
import { EnumParser } from '@daxserver/validation-schema-codegen/parsers/parse-enums'
import { FunctionDeclarationParser } from '@daxserver/validation-schema-codegen/parsers/parse-function-declarations'
import { InterfaceParser } from '@daxserver/validation-schema-codegen/parsers/parse-interfaces'
import { TypeAliasParser } from '@daxserver/validation-schema-codegen/parsers/parse-type-aliases'
import { DependencyCollector } from '@daxserver/validation-schema-codegen/utils/dependency-collector'
import { getInterfaceProcessingOrder } from '@daxserver/validation-schema-codegen/utils/interface-processing-order'
import { Project, ts } from 'ts-morph'

export interface GenerateCodeOptions extends InputOptions {
  exportEverything?: boolean
}

export const generateCode = async ({
  sourceCode,
  filePath,
  exportEverything = false,
  ...options
}: GenerateCodeOptions): Promise<string> => {
  const sourceFile = createSourceFileFromInput({
    sourceCode,
    filePath,
    ...options,
  })
  const processedTypes = new Set<string>()
  const newSourceFile = new Project().createSourceFile('output.ts', '', {
    overwrite: true,
  })

  // Add imports
  newSourceFile.addImportDeclaration({
    moduleSpecifier: '@sinclair/typebox',
    namedImports: [
      'Type',
      {
        name: 'Static',
        isTypeOnly: true,
      },
    ],
  })

  const parserOptions = {
    newSourceFile,
    printer: ts.createPrinter(),
    processedTypes,
    exportEverything,
  }

  const typeAliasParser = new TypeAliasParser(parserOptions)
  const enumParser = new EnumParser(parserOptions)
  const interfaceParser = new InterfaceParser(parserOptions)
  const functionDeclarationParser = new FunctionDeclarationParser(parserOptions)
  const dependencyCollector = new DependencyCollector()

  // Collect all dependencies in correct order
  const importDeclarations = sourceFile.getImportDeclarations()
  const localTypeAliases = sourceFile.getTypeAliases()

  // Always add local types first so they can be included in topological sort
  dependencyCollector.addLocalTypes(localTypeAliases, sourceFile)

  const orderedDependencies = dependencyCollector.collectFromImports(
    importDeclarations,
    exportEverything,
  )

  // Process all dependencies (both imported and local) in topological order
  orderedDependencies.forEach((dependency) => {
    if (!processedTypes.has(dependency.typeAlias.getName())) {
      typeAliasParser.parseWithImportFlag(dependency.typeAlias, dependency.isImported)
    }
  })

  // Process any remaining local types that weren't included in the dependency graph
  if (exportEverything) {
    localTypeAliases.forEach((typeAlias) => {
      if (!processedTypes.has(typeAlias.getName())) {
        typeAliasParser.parseWithImportFlag(typeAlias, false)
      }
    })
  }

  // Process enums
  sourceFile.getEnums().forEach((e) => {
    enumParser.parse(e)
  })

  // Process interfaces in dependency order
  getInterfaceProcessingOrder(sourceFile.getInterfaces()).forEach((i) => {
    interfaceParser.parse(i)
  })

  // Process function declarations
  sourceFile.getFunctions().forEach((f) => {
    functionDeclarationParser.parse(f)
  })

  return newSourceFile.getFullText()
}
