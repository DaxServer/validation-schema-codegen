import {
  createSourceFileFromInput,
  type InputOptions,
} from '@daxserver/validation-schema-codegen/input-handler'
import { EnumParser } from '@daxserver/validation-schema-codegen/parsers/parse-enums'
import { FunctionDeclarationParser } from '@daxserver/validation-schema-codegen/parsers/parse-function-declarations'
import { InterfaceParser } from '@daxserver/validation-schema-codegen/parsers/parse-interfaces'
import { TypeAliasParser } from '@daxserver/validation-schema-codegen/parsers/parse-type-aliases'
import { DependencyTraversal } from '@daxserver/validation-schema-codegen/traverse/dependency-traversal'
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

  // Check if any interfaces have generic type parameters
  const hasGenericInterfaces = sourceFile
    .getInterfaces()
    .some((i) => i.getTypeParameters().length > 0)

  // Add imports
  const namedImports = [
    'Type',
    {
      name: 'Static',
      isTypeOnly: true,
    },
  ]

  if (hasGenericInterfaces) {
    namedImports.push({
      name: 'TSchema',
      isTypeOnly: true,
    })
  }

  newSourceFile.addImportDeclaration({
    moduleSpecifier: '@sinclair/typebox',
    namedImports,
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
  const dependencyTraversal = new DependencyTraversal()

  // Collect all dependencies in correct order
  const importDeclarations = sourceFile.getImportDeclarations()
  const localTypeAliases = sourceFile.getTypeAliases()
  const interfaces = sourceFile.getInterfaces()

  // Analyze cross-dependencies between interfaces and type aliases
  const dependencyAnalysis = dependencyTraversal.analyzeProcessingOrder(
    localTypeAliases,
    interfaces,
  )

  // Handle different dependency scenarios:
  // 1. If interfaces depend on type aliases, process those type aliases first
  // 2. If only type aliases depend on interfaces, process interfaces first
  // 3. If both scenarios exist, process in order: type aliases interfaces depend on -> interfaces -> type aliases that depend on interfaces

  const hasInterfacesDependingOnTypeAliases =
    dependencyAnalysis.interfacesDependingOnTypeAliases.length > 0
  const hasTypeAliasesDependingOnInterfaces =
    dependencyAnalysis.typeAliasesDependingOnInterfaces.length > 0

  if (hasInterfacesDependingOnTypeAliases && !hasTypeAliasesDependingOnInterfaces) {
    // Case 1: Only interfaces depend on type aliases - process type aliases first (normal order)
    // This will be handled by the normal dependency collection below
  } else if (!hasInterfacesDependingOnTypeAliases && hasTypeAliasesDependingOnInterfaces) {
    // Case 2: Only type aliases depend on interfaces - process interfaces first
    getInterfaceProcessingOrder(interfaces).forEach((i) => {
      interfaceParser.parse(i)
    })
  } else if (hasInterfacesDependingOnTypeAliases && hasTypeAliasesDependingOnInterfaces) {
    // Case 3: Both dependencies exist - process type aliases that interfaces depend on first
    // This will be handled by the normal dependency collection below, then interfaces, then remaining type aliases
  }

  // Always add local types first so they can be included in topological sort
  dependencyTraversal.addLocalTypes(localTypeAliases, sourceFile)

  // Collect from imports to resolve dependencies
  dependencyTraversal.collectFromImports(importDeclarations)

  // Filter unused imports if exportEverything is false
  if (!exportEverything) {
    dependencyTraversal.filterUnusedImports()
  }

  const orderedDependencies = dependencyTraversal.getTopologicallySortedTypes(exportEverything)

  if (!hasInterfacesDependingOnTypeAliases && hasTypeAliasesDependingOnInterfaces) {
    // Case 2: Only process type aliases that don't depend on interfaces
    orderedDependencies.forEach((dependency) => {
      const dependsOnInterface = dependencyAnalysis.typeAliasesDependingOnInterfaces.includes(
        dependency.typeAlias.getName(),
      )
      if (!dependsOnInterface && !processedTypes.has(dependency.typeAlias.getName())) {
        typeAliasParser.parseWithImportFlag(dependency.typeAlias, dependency.isImported)
      }
    })
  } else if (hasInterfacesDependingOnTypeAliases && hasTypeAliasesDependingOnInterfaces) {
    // Case 3: Process only type aliases that interfaces depend on (phase 1)
    orderedDependencies.forEach((dependency) => {
      const interfaceDependsOnThis = dependencyAnalysis.interfacesDependingOnTypeAliases.some(
        (interfaceName) => {
          const interfaceDecl = interfaces.find((i) => i.getName() === interfaceName)
          if (!interfaceDecl) return false
          const typeAliasRefs = dependencyTraversal.extractTypeAliasReferences(
            interfaceDecl,
            new Map(localTypeAliases.map((ta) => [ta.getName(), ta])),
          )
          return typeAliasRefs.includes(dependency.typeAlias.getName())
        },
      )
      const dependsOnInterface = dependencyAnalysis.typeAliasesDependingOnInterfaces.includes(
        dependency.typeAlias.getName(),
      )
      if (
        interfaceDependsOnThis &&
        !dependsOnInterface &&
        !processedTypes.has(dependency.typeAlias.getName())
      ) {
        typeAliasParser.parseWithImportFlag(dependency.typeAlias, dependency.isImported)
      }
    })
  } else {
    // Case 1: Process all dependencies (both imported and local) in topological order
    orderedDependencies.forEach((dependency) => {
      if (!processedTypes.has(dependency.typeAlias.getName())) {
        typeAliasParser.parseWithImportFlag(dependency.typeAlias, dependency.isImported)
      }
    })
  }

  // Process enums
  sourceFile.getEnums().forEach((e) => {
    enumParser.parse(e)
  })

  // Process interfaces in dependency order
  if (
    hasInterfacesDependingOnTypeAliases ||
    (!hasInterfacesDependingOnTypeAliases && !hasTypeAliasesDependingOnInterfaces)
  ) {
    // Case 1 and Case 3: Process interfaces after type aliases they depend on
    getInterfaceProcessingOrder(interfaces).forEach((i) => {
      interfaceParser.parse(i)
    })
  }
  // Case 2: Interfaces were already processed above

  // Process remaining type aliases that depend on interfaces (Case 2 and Case 3)
  if (hasTypeAliasesDependingOnInterfaces) {
    // Process remaining type aliases (phase 2)
    orderedDependencies.forEach((dependency) => {
      const dependsOnInterface = dependencyAnalysis.typeAliasesDependingOnInterfaces.includes(
        dependency.typeAlias.getName(),
      )
      if (dependsOnInterface && !processedTypes.has(dependency.typeAlias.getName())) {
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
  }

  // Process function declarations
  sourceFile.getFunctions().forEach((f) => {
    functionDeclarationParser.parse(f)
  })

  return newSourceFile.getFullText()
}
