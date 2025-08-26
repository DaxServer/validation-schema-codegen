import { ASTTraversal } from '@daxserver/validation-schema-codegen/traverse/ast-traversal'
import { InterfaceDeclaration, TypeAliasDeclaration } from 'ts-morph'

/**
 * Dependency analyzer for determining processing order
 */
export class DependencyAnalyzer {
  /**
   * Extract interface names referenced by a type alias
   */
  extractInterfaceReferences(
    typeAlias: TypeAliasDeclaration,
    interfaces: Map<string, InterfaceDeclaration>,
  ): string[] {
    return ASTTraversal.extractInterfaceReferences(typeAlias, interfaces)
  }

  /**
   * Extract type alias names referenced by an interface
   */
  extractTypeAliasReferences(
    interfaceDecl: InterfaceDeclaration,
    typeAliases: Map<string, TypeAliasDeclaration>,
  ): string[] {
    return ASTTraversal.extractTypeAliasReferences(interfaceDecl, typeAliases)
  }

  /**
   * Check if any type aliases reference interfaces
   */
  hasInterfaceReferences(
    typeAliases: TypeAliasDeclaration[],
    interfaces: InterfaceDeclaration[],
  ): boolean {
    const interfaceMap = new Map<string, InterfaceDeclaration>()
    for (const iface of interfaces) {
      interfaceMap.set(iface.getName(), iface)
    }

    for (const typeAlias of typeAliases) {
      const references = this.extractInterfaceReferences(typeAlias, interfaceMap)
      if (references.length > 0) {
        return true
      }
    }

    return false
  }

  /**
   * Get type aliases that reference interfaces, ordered by their dependencies
   */
  getTypeAliasesReferencingInterfaces(
    typeAliases: TypeAliasDeclaration[],
    interfaces: InterfaceDeclaration[],
  ): { typeAlias: TypeAliasDeclaration; referencedInterfaces: string[] }[] {
    const interfaceMap = new Map<string, InterfaceDeclaration>()
    for (const iface of interfaces) {
      interfaceMap.set(iface.getName(), iface)
    }

    const result: { typeAlias: TypeAliasDeclaration; referencedInterfaces: string[] }[] = []

    for (const typeAlias of typeAliases) {
      const references = this.extractInterfaceReferences(typeAlias, interfaceMap)
      if (references.length > 0) {
        result.push({
          typeAlias,
          referencedInterfaces: references,
        })
      }
    }

    return result
  }

  /**
   * Determine the correct processing order for interfaces and type aliases
   * Returns an object indicating which should be processed first
   */
  analyzeProcessingOrder(
    typeAliases: TypeAliasDeclaration[],
    interfaces: InterfaceDeclaration[],
  ): {
    processInterfacesFirst: boolean
    typeAliasesDependingOnInterfaces: string[]
    interfacesDependingOnTypeAliases: string[]
  } {
    const typeAliasMap = new Map<string, TypeAliasDeclaration>()
    const interfaceMap = new Map<string, InterfaceDeclaration>()

    for (const typeAlias of typeAliases) {
      typeAliasMap.set(typeAlias.getName(), typeAlias)
    }

    for (const interfaceDecl of interfaces) {
      interfaceMap.set(interfaceDecl.getName(), interfaceDecl)
    }

    const typeAliasesDependingOnInterfaces: string[] = []
    const interfacesDependingOnTypeAliases: string[] = []

    // Check type aliases that depend on interfaces
    for (const typeAlias of typeAliases) {
      const interfaceRefs = this.extractInterfaceReferences(typeAlias, interfaceMap)
      if (interfaceRefs.length > 0) {
        typeAliasesDependingOnInterfaces.push(typeAlias.getName())
      }
    }

    // Check interfaces that depend on type aliases
    for (const interfaceDecl of interfaces) {
      const typeAliasRefs = this.extractTypeAliasReferences(interfaceDecl, typeAliasMap)
      if (typeAliasRefs.length > 0) {
        interfacesDependingOnTypeAliases.push(interfaceDecl.getName())
      }
    }

    // Determine processing order:
    // If interfaces depend on type aliases, process type aliases first
    // If only type aliases depend on interfaces, process interfaces first
    // If both have dependencies, process type aliases that interfaces depend on first,
    // then interfaces, then type aliases that depend on interfaces
    const processInterfacesFirst =
      interfacesDependingOnTypeAliases.length === 0 && typeAliasesDependingOnInterfaces.length > 0

    return {
      processInterfacesFirst,
      typeAliasesDependingOnInterfaces,
      interfacesDependingOnTypeAliases,
    }
  }

  /**
   * Clear internal caches
   */
  clearCache(): void {
    ASTTraversal.clearCache()
  }
}
