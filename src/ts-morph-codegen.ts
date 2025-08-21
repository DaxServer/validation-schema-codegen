import { EnumParser } from '@daxserver/validation-schema-codegen/parsers/parse-enums'
import { FunctionDeclarationParser } from '@daxserver/validation-schema-codegen/parsers/parse-function-declarations'
import { InterfaceParser } from '@daxserver/validation-schema-codegen/parsers/parse-interfaces'
import { TypeAliasParser } from '@daxserver/validation-schema-codegen/parsers/parse-type-aliases'
import {
  DependencyCollector,
  type TypeDependency,
} from '@daxserver/validation-schema-codegen/utils/dependency-collector'
import { SourceFile, ts } from 'ts-morph'
import { parseNative } from 'tsconfck'

const sharedPrinter = ts.createPrinter()

export const generateCode = async (
  sourceFile: SourceFile,
  options: {
    exportEverything: boolean
  } = { exportEverything: false },
): Promise<string> => {
  const processedTypes = new Set<string>()
  const newSourceFile = sourceFile.getProject().createSourceFile('temp.ts', '', {
    overwrite: true,
  })

  // Automatically detect and parse TSConfig using tsconfck.parseNative
  let verbatimModuleSyntax = false
  try {
    const sourceFilePath = sourceFile.getFilePath()
    const tsConfigResult = await parseNative(sourceFilePath)
    verbatimModuleSyntax = tsConfigResult.tsconfig?.compilerOptions?.verbatimModuleSyntax === true
  } catch {
    // If tsconfig detection fails, default to false
    verbatimModuleSyntax = false
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
