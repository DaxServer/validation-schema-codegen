import { basename } from 'node:path'
import type { SourceFile } from 'ts-morph'

/**
 * Simple hash function for generating unique identifiers
 */
const hashString = (str: string): string => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0 // force signed 32-bit
  }
  return (hash >>> 0).toString(36) // unsigned 32-bit
}

/**
 * Generate a fully qualified node name to prevent naming conflicts
 */
export const generateQualifiedNodeName = (typeName: string, sourceFile: SourceFile): string => {
  const filePath = sourceFile.getFilePath()
  const fileName = basename(filePath)
  const fileHash = hashString(filePath)
  return `${typeName}__${fileName}__${fileHash}`
}
