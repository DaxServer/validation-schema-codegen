import {
  createSourceFileFromInput,
  type InputOptions,
} from '@daxserver/validation-schema-codegen/input-handler'
import { TypeBoxPrinter } from '@daxserver/validation-schema-codegen/printer/typebox-printer'
import { DependencyTraversal } from '@daxserver/validation-schema-codegen/traverse/dependency-traversal'
import type { TraversedNode } from '@daxserver/validation-schema-codegen/traverse/types'
import type { VisualizationOptions } from '@daxserver/validation-schema-codegen/utils/graph-visualizer'
import { Node, Project, SourceFile, ts } from 'ts-morph'

const createOutputFile = (hasGenericInterfaces: boolean) => {
  const newSourceFile = new Project().createSourceFile('output.ts', '', {
    overwrite: true,
  })

  // Add imports
  const namedImports: { name: string; isTypeOnly: boolean }[] = [
    {
      name: 'Type',
      isTypeOnly: false,
    },
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

const printSortedNodes = (sortedTraversedNodes: TraversedNode[], newSourceFile: SourceFile) => {
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

export interface CodeGenerationOptions extends InputOptions {
  visualizationOptions?: VisualizationOptions
}

export const generateVisualization = async (options: CodeGenerationOptions): Promise<string> => {
  // Create source file from input
  const sourceFile = createSourceFileFromInput(options)

  // Create dependency traversal and start traversal
  const dependencyTraversal = new DependencyTraversal()
  dependencyTraversal.startTraversal(sourceFile)

  // Generate visualization
  return await dependencyTraversal.visualizeGraph(options.visualizationOptions)
}

export const generateCode = (options: InputOptions): string => {
  // Create source file from input
  const sourceFile = createSourceFileFromInput(options)

  // Create dependency traversal and start traversal
  const dependencyTraversal = new DependencyTraversal()
  const traversedNodes = dependencyTraversal.startTraversal(sourceFile)

  // Check if any interfaces or type aliases have generic type parameters
  const hasGenericInterfaces = traversedNodes.some(
    (t) =>
      (Node.isInterfaceDeclaration(t.node) && t.node.getTypeParameters().length > 0) ||
      (Node.isTypeAliasDeclaration(t.node) && t.node.getTypeParameters().length > 0),
  )

  // Create output file with proper imports
  const newSourceFile = createOutputFile(hasGenericInterfaces)

  // Print sorted nodes to output
  const result = printSortedNodes(traversedNodes, newSourceFile)

  return result
}
