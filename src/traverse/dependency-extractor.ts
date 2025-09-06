import { markChunksAsRequired } from '@daxserver/validation-schema-codegen/traverse/chunk-large-types'
import { NodeGraph } from '@daxserver/validation-schema-codegen/traverse/node-graph'
import { TypeReferenceExtractor } from '@daxserver/validation-schema-codegen/traverse/type-reference-extractor'
import { resolverStore } from '@daxserver/validation-schema-codegen/utils/resolver-store'
import {
  EnumDeclaration,
  FunctionDeclaration,
  InterfaceDeclaration,
  Node,
  TypeAliasDeclaration,
} from 'ts-morph'

export const extractDependencies = (nodeGraph: NodeGraph, requiredNodeIds: Set<string>): void => {
  const processedNodes = new Set<string>()
  const nodesToProcess = new Set(requiredNodeIds)
  const typeReferenceExtractor = new TypeReferenceExtractor()

  // Process nodes iteratively until no new dependencies are found
  while (nodesToProcess.size > 0) {
    const currentNodeId = Array.from(nodesToProcess)[0]
    if (!currentNodeId) break

    nodesToProcess.delete(currentNodeId)

    if (processedNodes.has(currentNodeId)) continue
    processedNodes.add(currentNodeId)

    const nodeData = nodeGraph.getNode(currentNodeId)
    if (!nodeData) continue

    let nodeToAnalyze: Node | undefined

    if (nodeData.type === 'typeAlias') {
      const typeAlias = nodeData.node as TypeAliasDeclaration
      nodeToAnalyze = typeAlias.getTypeNode()
    } else if (nodeData.type === 'interface') {
      nodeToAnalyze = nodeData.node as InterfaceDeclaration
    } else if (nodeData.type === 'enum') {
      nodeToAnalyze = nodeData.node as EnumDeclaration
    } else if (nodeData.type === 'function') {
      nodeToAnalyze = nodeData.node as FunctionDeclaration
    }

    if (!nodeToAnalyze) continue

    const typeReferences = typeReferenceExtractor.extractTypeReferences(nodeToAnalyze)

    for (const referencedType of typeReferences) {
      if (resolverStore.hasQualifiedName(referencedType) && nodeGraph.hasNode(referencedType)) {
        // Only add to required if not already processed
        if (!requiredNodeIds.has(referencedType)) {
          requiredNodeIds.add(referencedType)
          nodesToProcess.add(referencedType)
          // Mark chunks as required if this type has chunks
          markChunksAsRequired(referencedType, nodeGraph, requiredNodeIds)
        }
        nodeGraph.addDependency(referencedType, currentNodeId)
      }
    }
  }
}
