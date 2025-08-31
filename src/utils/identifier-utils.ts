import { ts } from 'ts-morph'
import { getScriptTarget } from '@daxserver/validation-schema-codegen/utils/compiler-config'

/**
 * Validates if a string can be used as a JavaScript identifier using TypeScript's built-in utilities
 * Uses the runtime-determined script target for validation
 */
export const isValidIdentifier = (text: string, scriptTarget?: ts.ScriptTarget): boolean => {
  if (text.length === 0) return false

  const target = scriptTarget ?? getScriptTarget()

  // First character must be valid identifier start
  if (!ts.isIdentifierStart(text.charCodeAt(0), target)) return false

  // Remaining characters must be valid identifier parts
  for (let i = 1; i < text.length; i++) {
    if (!ts.isIdentifierPart(text.charCodeAt(i), target)) return false
  }

  return true
}
