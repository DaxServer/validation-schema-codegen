import {
  createSourceFileFromInput,
  type InputOptions,
} from '@daxserver/validation-schema-codegen/input-handler'
import { TypeBoxPrinter } from '@daxserver/validation-schema-codegen/printer/typebox-printer'
import { DependencyTraversal } from '@daxserver/validation-schema-codegen/traverse/dependency-traversal'
import type { TraversedNode } from '@daxserver/validation-schema-codegen/traverse/types'
import { Project, SourceFile, ts } from 'ts-morph'

const createOutputFile = (hasGenericInterfaces: boolean) => {
  const newSourceFile = new Project().createSourceFile('output.ts', '', {
    overwrite: true,
  })

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

  return newSourceFile
}

const printSortedNodes = (
  sortedTraversedNodes: TraversedNode[],
  newSourceFile: SourceFile,
) => {
  const printer = new TypeBoxPrinter({
    newSourceFile,
    printer: ts.createPrinter(),
  })

  // Process nodes in topological order
  for (const traversedNode of sortedTraversedNodes) {
    printer.printNode(traversedNode)
  }

  return newSourceFile.getFullText()
}

export const generateCode = async ({
  sourceCode,
  filePath,
  ...options
}: InputOptions): Promise<string> => {
  // Create source file from input
  const sourceFile = createSourceFileFromInput({
    sourceCode,
    filePath,
    ...options,
  })

  // Check if any interfaces have generic type parameters
  const hasGenericInterfaces = sourceFile
    .getInterfaces()
    .some((i) => i.getTypeParameters().length > 0)

  // Create output file with proper imports
  const newSourceFile = createOutputFile(hasGenericInterfaces)

  // Create dependency traversal and start traversal
  const dependencyTraversal = new DependencyTraversal()
  const traversedNodes = dependencyTraversal.startTraversal(sourceFile)

  // Print sorted nodes to output
  const result = printSortedNodes(traversedNodes, newSourceFile)

  return result
}
