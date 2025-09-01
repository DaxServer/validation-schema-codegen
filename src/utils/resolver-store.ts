import { basename } from 'path'
import type { SourceFile } from 'ts-morph'

export interface TypeMapping {
  originalName: string
  qualifiedName: string
  aliasName?: string
  sourceFile?: SourceFile
}

export interface TypeMappingInput {
  originalName: string
  sourceFile: SourceFile
  aliasName?: string
}

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
const generateQualifiedNodeName = (typeName: string, sourceFile: SourceFile): string => {
  const filePath = sourceFile.getFilePath()
  const fileName = basename(filePath)
  const fileHash = hashString(filePath)
  return `${typeName}__${fileName}__${fileHash}`
}

class ResolverStore {
  private typeMappings = new Map<string, TypeMapping>() // qualifiedName -> TypeMapping
  private originalNameIndex = new Map<string, string[]>() // originalName -> qualifiedName[]
  private aliasNameIndex = new Map<string, string>() // aliasName -> qualifiedName
  private qualifiedNameCache = new Map<string, string>() // originalName+sourceFilePath -> qualifiedName

  /**
   * Generate a qualified name for a type. This is the single source of truth for qualified name generation.
   */
  generateQualifiedName(originalName: string, sourceFile: SourceFile): string {
    const cacheKey = `${originalName}:${sourceFile.getFilePath()}`

    // Check cache first
    const cached = this.qualifiedNameCache.get(cacheKey)
    if (cached) {
      return cached
    }

    // Generate new qualified name
    const qualifiedName = generateQualifiedNodeName(originalName, sourceFile)

    // Cache the result
    this.qualifiedNameCache.set(cacheKey, qualifiedName)

    return qualifiedName
  }

  addTypeMapping(mapping: TypeMappingInput): void {
    const qualifiedName = this.generateQualifiedName(mapping.originalName, mapping.sourceFile)
    const typeMapping: TypeMapping = {
      originalName: mapping.originalName,
      qualifiedName,
      aliasName: mapping.aliasName,
      sourceFile: mapping.sourceFile,
    }

    this.typeMappings.set(qualifiedName, typeMapping)

    // Update originalName index to support multiple qualified names per original name
    const existingQualifiedNames = this.originalNameIndex.get(mapping.originalName) || []
    existingQualifiedNames.push(qualifiedName)
    this.originalNameIndex.set(mapping.originalName, existingQualifiedNames)

    if (mapping.aliasName) {
      this.aliasNameIndex.set(mapping.aliasName, qualifiedName)
    }
  }

  getTypeMappingByOriginalName(originalName: string): TypeMapping | null {
    const qualifiedNames = this.originalNameIndex.get(originalName)
    if (!qualifiedNames || qualifiedNames.length === 0) return null
    // Return the first mapping for now - could be enhanced for better disambiguation
    const firstQualifiedName = qualifiedNames[0]
    return firstQualifiedName ? this.typeMappings.get(firstQualifiedName) || null : null
  }

  getTypeMappingByQualifiedName(qualifiedName: string): TypeMapping | null {
    return this.typeMappings.get(qualifiedName) || null
  }

  getTypeMappingByAliasName(aliasName: string): TypeMapping | null {
    const qualifiedName = this.aliasNameIndex.get(aliasName)
    return qualifiedName ? this.typeMappings.get(qualifiedName) || null : null
  }

  resolveQualifiedName(typeName: string): string | null {
    // First try to find by alias name if available
    const byAlias = this.getTypeMappingByAliasName(typeName)
    if (byAlias) {
      return byAlias.qualifiedName
    }

    // Fallback to original name matching
    const byOriginal = this.getTypeMappingByOriginalName(typeName)
    return byOriginal ? byOriginal.qualifiedName : null
  }

  resolveAliasName(typeName: string): string {
    // First try to find by original name and return alias if available
    const byOriginal = this.getTypeMappingByOriginalName(typeName)
    if (byOriginal && byOriginal.aliasName) {
      return byOriginal.aliasName
    }

    // Return the original name if no alias found
    return typeName
  }

  hasTypeMapping(originalName: string): boolean {
    return this.originalNameIndex.has(originalName)
  }

  getAllTypeMappings(): ReadonlyMap<string, Readonly<TypeMapping>> {
    return new Map(this.typeMappings)
  }

  getQualifiedNames(): string[] {
    return Array.from(this.typeMappings.keys())
  }

  getOriginalNames(): string[] {
    return Array.from(this.originalNameIndex.keys())
  }

  getAliasNames(): string[] {
    return Array.from(this.aliasNameIndex.keys())
  }

  /**
   * Check if a qualified name exists in the store
   */
  hasQualifiedName(qualifiedName: string): boolean {
    return this.typeMappings.has(qualifiedName)
  }

  /**
   * Get all qualified names from the store
   */
  getAllQualifiedNames(): string[] {
    return Array.from(this.typeMappings.keys())
  }

  clear(): void {
    this.typeMappings.clear()
    this.originalNameIndex.clear()
    this.aliasNameIndex.clear()
    this.qualifiedNameCache.clear()
  }

  size(): number {
    return this.typeMappings.size
  }
}

export const resolverStore = new ResolverStore()
