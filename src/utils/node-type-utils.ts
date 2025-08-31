import { Node, SyntaxKind } from 'ts-morph'

/**
 * Utility functions for common Node type checks used in canHandle methods
 */

/**
 * Checks if a node is a specific SyntaxKind
 */
export const isSyntaxKind = (node: Node, kind: SyntaxKind): boolean => {
  return node.getKind() === kind
}

/**
 * Checks if a node is any of the specified SyntaxKinds
 */
export const isAnySyntaxKind = (node: Node, kinds: readonly SyntaxKind[]): boolean => {
  return kinds.includes(node.getKind())
}

/**
 * Checks if a node is a TypeOperatorTypeNode with a specific operator
 */
export const isTypeOperatorWithOperator = (node: Node, operator: SyntaxKind): boolean => {
  return Node.isTypeOperatorTypeNode(node) && node.getOperator() === operator
}

/**
 * Checks if a node is a TypeReference with a specific type name
 */
export const isTypeReferenceWithName = (node: Node, typeName: string): boolean => {
  if (!Node.isTypeReference(node)) return false

  const typeNameNode = node.getTypeName()

  return Node.isIdentifier(typeNameNode) && typeNameNode.getText() === typeName
}

/**
 * Checks if a node is a TypeReference with any of the specified type names
 */
export const isTypeReferenceWithAnyName = (node: Node, typeNames: string[]): boolean => {
  if (!Node.isTypeReference(node)) return false

  const typeNameNode = node.getTypeName()

  return Node.isIdentifier(typeNameNode) && typeNames.includes(typeNameNode.getText())
}
