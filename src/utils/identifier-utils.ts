import { getScriptTarget } from '@daxserver/validation-schema-codegen/utils/compiler-config'
import { ts } from 'ts-morph'

/**
 * Validates if a string can be used as a JavaScript identifier using TypeScript's built-in utilities
 * Uses the runtime-determined script target for validation
 * Properly handles Unicode characters including those outside the Basic Multilingual Plane
 */
export const isValidIdentifier = (text: string): boolean => {
  if (text.length === 0) return false

  const target = getScriptTarget()

  // First character must be valid identifier start
  const firstCodePoint = text.codePointAt(0)
  if (firstCodePoint === undefined || !ts.isIdentifierStart(firstCodePoint, target)) {
    return false
  }

  // Remaining characters must be valid identifier parts
  // Use for...of to properly iterate over Unicode code points
  let isFirst = true
  for (const char of text) {
    if (isFirst) {
      isFirst = false
      continue
    }

    const codePoint = char.codePointAt(0)
    if (codePoint === undefined || !ts.isIdentifierPart(codePoint, target)) {
      return false
    }
  }

  return true
}
