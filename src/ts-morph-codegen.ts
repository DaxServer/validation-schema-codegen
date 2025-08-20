import { ts, SourceFile } from 'ts-morph'
import { TypeAliasParser } from './parsers/parse-type-aliases'
import { EnumParser } from './parsers/parse-enums'
import { InterfaceParser } from './parsers/parse-interfaces'
import { FunctionDeclarationParser } from './parsers/parse-function-declarations'
import { DependencyCollector, type TypeDependency } from './utils/dependency-collector'

const sharedPrinter = ts.createPrinter()

export const generateCode = (
  sourceFile: SourceFile,
  options: {
    exportEverything: boolean
  } = { exportEverything: false },
): string => {
  const processedTypes = new Set<string>()
  const newSourceFile = sourceFile.getProject().createSourceFile('temp.ts', '', {
    overwrite: true,
  })

  newSourceFile.addImportDeclaration({
    moduleSpecifier: '@sinclair/typebox',
    namedImports: ['Type', 'Static'],
  })

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
