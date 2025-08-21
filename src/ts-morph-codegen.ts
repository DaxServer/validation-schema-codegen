import { ts, SourceFile } from 'ts-morph'
import { TypeAliasParser } from './parsers/parse-type-aliases'
import { EnumParser } from './parsers/parse-enums'
import { InterfaceParser } from './parsers/parse-interfaces'
import { FunctionDeclarationParser } from './parsers/parse-function-declarations'
import { DependencyCollector, type TypeDependency } from './utils/dependency-collector'
import { loadTSConfig, type TSConfigInput } from './utils/tsconfig-loader'

const sharedPrinter = ts.createPrinter()

export const generateCode = async (
  sourceFile: SourceFile,
  options: {
    exportEverything: boolean
    tsConfig?: TSConfigInput
  } = { exportEverything: false },
): Promise<string> => {
  const processedTypes = new Set<string>()
  const newSourceFile = sourceFile.getProject().createSourceFile('temp.ts', '', {
    overwrite: true,
  })

  // Load TSConfig and determine verbatimModuleSyntax setting
  let verbatimModuleSyntax = false
  if (options.tsConfig) {
    const tsConfigResult = await loadTSConfig(options.tsConfig)
    verbatimModuleSyntax = tsConfigResult.verbatimModuleSyntax
  }

  // Add imports based on verbatimModuleSyntax setting
  if (verbatimModuleSyntax) {
    newSourceFile.addImportDeclaration({
      moduleSpecifier: '@sinclair/typebox',
      namedImports: ['Type'],
    })
    newSourceFile.addImportDeclaration({
      moduleSpecifier: '@sinclair/typebox',
      namedImports: [{ name: 'Static', isTypeOnly: true }],
    })
  } else {
    newSourceFile.addImportDeclaration({
      moduleSpecifier: '@sinclair/typebox',
      namedImports: ['Type', 'Static'],
    })
  }

  const parserOptions = {
    newSourceFile,
    printer: sharedPrinter,
    processedTypes,
    exportEverything: options.exportEverything,
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
  if (options.exportEverything) {
    // When exporting everything, maintain original order
    orderedDependencies = dependencyCollector.collectFromImports(
      importDeclarations,
      options.exportEverything,
    )
    dependencyCollector.addLocalTypes(localTypeAliases, sourceFile)
  } else {
    // When not exporting everything, add local types first so filtering can detect their dependencies
    dependencyCollector.addLocalTypes(localTypeAliases, sourceFile)
    orderedDependencies = dependencyCollector.collectFromImports(
      importDeclarations,
      options.exportEverything,
    )
  }

  // Process all dependencies in topological order
  for (const dependency of orderedDependencies) {
    if (!processedTypes.has(dependency.typeAlias.getName())) {
      typeAliasParser.parseWithImportFlag(dependency.typeAlias, dependency.isImported)
    }
  }

  // Process local types
  if (options.exportEverything) {
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
