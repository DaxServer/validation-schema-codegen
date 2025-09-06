import { NodeGraph } from '@daxserver/validation-schema-codegen/traverse/node-graph'
import type { TraversedNode } from '@daxserver/validation-schema-codegen/traverse/types'
import { resolverStore } from '@daxserver/validation-schema-codegen/utils/resolver-store'
import { Node, SourceFile } from 'ts-morph'

const CHUNK_SIZE = 20

export const shouldChunkUnion = (node: Node): boolean => {
  if (Node.isUnionTypeNode(node)) {
    return node.getTypeNodes().length >= CHUNK_SIZE
  }

  // Handle IndexedAccessType that resolves to large unions (e.g., typeof sites[number])
  if (Node.isIndexedAccessTypeNode(node)) {
    const typeChecker = node.getProject().getTypeChecker()
    const type = typeChecker.getTypeAtLocation(node)
    if (type.isUnion()) {
      return type.getUnionTypes().length >= CHUNK_SIZE
    }
  }

  return false
}

export const createChunkNodes = (
  node: Node,
  parentTypeName: string,
  nodeGraph: NodeGraph,
  maincodeNodeIds: Set<string>,
  requiredNodeIds: Set<string>,
  sourceFile: SourceFile,
  addToRequired: boolean = true,
): string[] => {
  let typeTexts: string[] = []

  if (Node.isUnionTypeNode(node)) {
    typeTexts = node.getTypeNodes().map((n) => n.getText())
  } else if (Node.isIndexedAccessTypeNode(node)) {
    // Handle IndexedAccessType by resolving to union types
    const typeChecker = node.getProject().getTypeChecker()
    const type = typeChecker.getTypeAtLocation(node)
    if (type.isUnion()) {
      typeTexts = type.getUnionTypes().map((t) => t.getText())
    }
  }

  if (typeTexts.length === 0) {
    return []
  }
  const chunks: string[][] = []

  // Create chunks of 20 items each
  for (let i = 0; i < typeTexts.length; i += CHUNK_SIZE) {
    chunks.push(typeTexts.slice(i, i + CHUNK_SIZE))
  }

  const chunkReferences: string[] = []

  // Create chunk nodes
  for (let i = 0; i < chunks.length; i++) {
    const chunkName = `${parentTypeName}_Chunk${i + 1}`
    const chunkQualifiedName = resolverStore.generateQualifiedName(chunkName, sourceFile)

    chunkReferences.push(chunkQualifiedName)
    maincodeNodeIds.add(chunkQualifiedName)
    if (addToRequired) {
      requiredNodeIds.add(chunkQualifiedName)
    }

    // Create a new union node with only the chunk's type texts
    const chunkTypeTexts = chunks[i]!

    // Create a synthetic union node for this chunk
    const project = node.getProject()
    const tempFileName = `__temp_chunk_${parentTypeName}_${i}_${Date.now()}.ts`
    const tempSourceFile = project.createSourceFile(
      tempFileName,
      `type TempChunk = ${chunkTypeTexts.join(' | ')}`,
    )
    const tempTypeAlias = tempSourceFile.getTypeAliases()[0]!
    const chunkTypeNode = tempTypeAlias.getTypeNode()!

    const chunkTraversedNode: TraversedNode = {
      node: chunkTypeNode, // Use the chunk-specific union node
      type: 'chunk',
      originalName: chunkName,
      qualifiedName: chunkQualifiedName,
      isImported: false,
      isMainCode: true,
      isChunk: true,
      chunkReferences: [], // Chunk nodes don't need references to other chunks
    }

    nodeGraph.addTypeNode(chunkQualifiedName, chunkTraversedNode)

    // Add to ResolverStore
    resolverStore.addTypeMapping({
      originalName: chunkName,
      sourceFile,
    })
  }

  return chunkReferences
}

export const markChunksAsRequired = (
  parentQualifiedName: string,
  nodeGraph: NodeGraph,
  requiredNodeIds: Set<string>,
): void => {
  const parentNode = nodeGraph.getNode(parentQualifiedName)
  if (parentNode?.chunkReferences) {
    for (const chunkRef of parentNode.chunkReferences) {
      requiredNodeIds.add(chunkRef)
    }
  }
}
