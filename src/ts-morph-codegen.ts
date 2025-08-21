import {
  createSourceFileFromInput,
  type InputOptions,
} from '@daxserver/validation-schema-codegen/input-handler'
import { EnumParser } from '@daxserver/validation-schema-codegen/parsers/parse-enums'
import { FunctionDeclarationParser } from '@daxserver/validation-schema-codegen/parsers/parse-function-declarations'
import { InterfaceParser } from '@daxserver/validation-schema-codegen/parsers/parse-interfaces'
import { TypeAliasParser } from '@daxserver/validation-schema-codegen/parsers/parse-type-aliases'
import {
  DependencyCollector,
  type TypeDependency,
} from '@daxserver/validation-schema-codegen/utils/dependency-collector'
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

  let orderedDependencies: TypeDependency[]
  if (exportEverything) {
    // When exporting everything, maintain original order
    orderedDependencies = dependencyCollector.collectFromImports(
      importDeclarations,
      exportEverything,
    )
    dependencyCollector.addLocalTypes(localTypeAliases, sourceFile)
  } else {
    // When not exporting everything, add local types first so filtering can detect their dependencies
    dependencyCollector.addLocalTypes(localTypeAliases, sourceFile)
    orderedDependencies = dependencyCollector.collectFromImports(
      importDeclarations,
      exportEverything,
    )
  }

  // Process all dependencies in topological order
  for (const dependency of orderedDependencies) {
    if (!processedTypes.has(dependency.typeAlias.getName())) {
      typeAliasParser.parseWithImportFlag(dependency.typeAlias, dependency.isImported)
    }
  }

  // Process local types
  if (exportEverything) {
    for (const typeAlias of localTypeAliases) {
      typeAliasParser.parseWithImportFlag(typeAlias, false)
    }
  } else {
    for (const typeAlias of localTypeAliases) {
      if (!processedTypes.has(typeAlias.getName())) {
        typeAliasParser.parseWithImportFlag(typeAlias, false)
      }
    }
  }

  // Process enums
  sourceFile.getEnums().forEach((enumDeclaration) => {
    enumParser.parse(enumDeclaration)
  })

  // Process interfaces
  sourceFile.getInterfaces().forEach((interfaceDeclaration) => {
    interfaceParser.parse(interfaceDeclaration)
  })

  // Process function declarations
  sourceFile.getFunctions().forEach((functionDeclaration) => {
    functionDeclarationParser.parse(functionDeclaration)
  })

  return newSourceFile.getFullText()
}
