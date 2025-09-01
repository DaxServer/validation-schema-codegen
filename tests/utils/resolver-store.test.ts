import type { TypeMappingInput } from '@daxserver/validation-schema-codegen/utils/resolver-store'
import { resolverStore } from '@daxserver/validation-schema-codegen/utils/resolver-store'
import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

describe('ResolverStore', () => {
  let project: Project

  beforeEach(() => {
    project = new Project()
    resolverStore.clear()
  })

  test('should add and retrieve type mappings by original name', () => {
    const sourceFile = project.createSourceFile(
      'models/user.ts',
      'export type User = { id: string }',
    )
    const mapping: TypeMappingInput = {
      originalName: 'User',
      sourceFile,
      aliasName: 'UserType',
    }

    resolverStore.addTypeMapping(mapping)
    const retrieved = resolverStore.getTypeMappingByOriginalName('User')

    expect(retrieved?.originalName).toBe('User')
    expect(retrieved?.aliasName).toBe('UserType')
    expect(retrieved?.qualifiedName).toContain('User')
  })

  test('should retrieve type mappings by qualified name', () => {
    const sourceFile = project.createSourceFile(
      'entities/product.ts',
      'export type Product = { id: string }',
    )
    const mapping: TypeMappingInput = {
      originalName: 'Product',
      sourceFile,
      aliasName: 'ProductType',
    }

    resolverStore.addTypeMapping(mapping)
    const retrieved = resolverStore.getTypeMappingByOriginalName('Product')
    const qualifiedName = retrieved?.qualifiedName

    expect(qualifiedName).toBeDefined()
    if (qualifiedName) {
      const retrievedByQualified = resolverStore.getTypeMappingByQualifiedName(qualifiedName)
      expect(retrievedByQualified?.originalName).toBe('Product')
    }
  })

  test('should retrieve type mappings by alias name', () => {
    const sourceFile = project.createSourceFile(
      'domain/order.ts',
      'export type Order = { id: string }',
    )
    const mapping: TypeMappingInput = {
      originalName: 'Order',
      sourceFile,
      aliasName: 'OrderType',
    }

    resolverStore.addTypeMapping(mapping)
    const retrieved = resolverStore.getTypeMappingByAliasName('OrderType')

    expect(retrieved?.originalName).toBe('Order')
    expect(retrieved?.aliasName).toBe('OrderType')
  })

  test('should handle mappings without alias names', () => {
    const sourceFile = project.createSourceFile(
      'models/category.ts',
      'export type Category = { id: string }',
    )
    const mapping: TypeMappingInput = {
      originalName: 'Category',
      sourceFile,
    }

    resolverStore.addTypeMapping(mapping)
    const retrieved = resolverStore.getTypeMappingByOriginalName('Category')

    expect(retrieved?.originalName).toBe('Category')
    expect(retrieved?.qualifiedName).toContain('Category')
    expect(retrieved?.aliasName).toBeUndefined()
  })

  test('should resolve qualified names correctly', () => {
    const userSourceFile = project.createSourceFile(
      'models/user.ts',
      'export type User = { id: string }',
    )
    const productSourceFile = project.createSourceFile(
      'entities/product.ts',
      'export type Product = { id: string }',
    )

    resolverStore.addTypeMapping({
      originalName: 'User',
      sourceFile: userSourceFile,
      aliasName: 'UserType',
    })

    resolverStore.addTypeMapping({
      originalName: 'Product',
      sourceFile: productSourceFile,
    })

    const userQualifiedName = resolverStore.resolveQualifiedName('User')
    const userTypeQualifiedName = resolverStore.resolveQualifiedName('UserType')
    const productQualifiedName = resolverStore.resolveQualifiedName('Product')
    const unknownQualifiedName = resolverStore.resolveQualifiedName('Unknown')

    expect(userQualifiedName).toContain('User')
    expect(userTypeQualifiedName).toContain('User')
    expect(productQualifiedName).toContain('Product')
    expect(unknownQualifiedName).toBeNull()
  })

  test('should resolve alias names correctly', () => {
    const userSourceFile = project.createSourceFile(
      'models/user.ts',
      'export type User = { id: string }',
    )
    const productSourceFile = project.createSourceFile(
      'entities/product.ts',
      'export type Product = { id: string }',
    )

    resolverStore.addTypeMapping({
      originalName: 'User',
      sourceFile: userSourceFile,
      aliasName: 'UserType',
    })

    resolverStore.addTypeMapping({
      originalName: 'Product',
      sourceFile: productSourceFile,
    })

    expect(resolverStore.resolveAliasName('User')).toBe('UserType')
    expect(resolverStore.resolveAliasName('Product')).toBe('Product')
    expect(resolverStore.resolveAliasName('Unknown')).toBe('Unknown')
  })

  test('should check if type mapping exists', () => {
    const sourceFile = project.createSourceFile(
      'models/user.ts',
      'export type User = { id: string }',
    )

    resolverStore.addTypeMapping({
      originalName: 'User',
      sourceFile,
    })

    expect(resolverStore.hasTypeMapping('User')).toBe(true)
    expect(resolverStore.hasTypeMapping('NonExistent')).toBe(false)
  })

  test('should return all type mappings', () => {
    const userSourceFile = project.createSourceFile(
      'models/user.ts',
      'export type User = { id: string }',
    )
    const productSourceFile = project.createSourceFile(
      'entities/product.ts',
      'export type Product = { id: string }',
    )
    const orderSourceFile = project.createSourceFile(
      'domain/order.ts',
      'export type Order = { id: string }',
    )

    resolverStore.addTypeMapping({
      originalName: 'User',
      sourceFile: userSourceFile,
    })

    resolverStore.addTypeMapping({
      originalName: 'Product',
      sourceFile: productSourceFile,
    })

    resolverStore.addTypeMapping({
      originalName: 'Order',
      sourceFile: orderSourceFile,
    })

    const allMappings = resolverStore.getAllTypeMappings()
    expect(allMappings.size).toBe(3)

    // Check that the mappings contain the expected original names in their values
    const mappingValues = Array.from(allMappings.values())
    const originalNames = mappingValues.map((m) => m.originalName)
    expect(originalNames).toContain('User')
    expect(originalNames).toContain('Product')
    expect(originalNames).toContain('Order')
  })

  test('should return qualified names', () => {
    const userSourceFile = project.createSourceFile(
      'models/user.ts',
      'export type User = { id: string }',
    )
    const productSourceFile = project.createSourceFile(
      'entities/product.ts',
      'export type Product = { id: string }',
    )

    resolverStore.addTypeMapping({
      originalName: 'User',
      sourceFile: userSourceFile,
    })

    resolverStore.addTypeMapping({
      originalName: 'Product',
      sourceFile: productSourceFile,
    })

    const qualifiedNames = resolverStore.getQualifiedNames()
    expect(qualifiedNames).toHaveLength(2)
    expect(qualifiedNames.some((name) => name.includes('User'))).toBe(true)
    expect(qualifiedNames.some((name) => name.includes('Product'))).toBe(true)
  })

  test('should return original names', () => {
    const userSourceFile = project.createSourceFile(
      'models/user.ts',
      'export type User = { id: string }',
    )
    const productSourceFile = project.createSourceFile(
      'entities/product.ts',
      'export type Product = { id: string }',
    )

    resolverStore.addTypeMapping({
      originalName: 'User',
      sourceFile: userSourceFile,
    })

    resolverStore.addTypeMapping({
      originalName: 'Product',
      sourceFile: productSourceFile,
    })

    const originalNames = resolverStore.getOriginalNames()
    expect(originalNames).toEqual(['User', 'Product'])
  })

  test('should return alias names', () => {
    const userSourceFile = project.createSourceFile(
      'models/user.ts',
      'export type User = { id: string }',
    )
    const productSourceFile = project.createSourceFile(
      'entities/product.ts',
      'export type Product = { id: string }',
    )

    resolverStore.addTypeMapping({
      originalName: 'User',
      sourceFile: userSourceFile,
      aliasName: 'UserType',
    })

    resolverStore.addTypeMapping({
      originalName: 'Product',
      sourceFile: productSourceFile,
    })

    const aliasNames = resolverStore.getAliasNames()
    expect(aliasNames).toEqual(['UserType'])
  })

  test('should clear all mappings', () => {
    const sourceFile = project.createSourceFile(
      'models/user.ts',
      'export type User = { id: string }',
    )

    resolverStore.addTypeMapping({
      originalName: 'User',
      sourceFile,
    })

    expect(resolverStore.size()).toBe(1)
    resolverStore.clear()
    expect(resolverStore.size()).toBe(0)
  })

  test('should return correct size', () => {
    expect(resolverStore.size()).toBe(0)

    const userSourceFile = project.createSourceFile(
      'models/user.ts',
      'export type User = { id: string }',
    )
    const productSourceFile = project.createSourceFile(
      'entities/product.ts',
      'export type Product = { id: string }',
    )

    resolverStore.addTypeMapping({
      originalName: 'User',
      sourceFile: userSourceFile,
    })
    expect(resolverStore.size()).toBe(1)

    resolverStore.addTypeMapping({
      originalName: 'Product',
      sourceFile: productSourceFile,
    })
    expect(resolverStore.size()).toBe(2)
  })
})
