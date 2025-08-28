import { DependencyTraversal } from '@daxserver/validation-schema-codegen/traverse/dependency-traversal'
import { describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

describe('Circular dependency issues', () => {
  test('should handle forward references correctly', () => {
    const project = new Project()

    // Reproduce the exact issue from wikibase entity.d.ts
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
      export type Entities = Record<EntityId, Entity>
      export type SimplifiedEntities = Record<EntityId, SimplifiedEntity>

      export interface EntityInfo<T> {
        id: T
      }

      export type EntityId = ItemId | PropertyId
      export type ItemId = \`Q\${number}\`
      export type PropertyId = \`P\${number}\`

      export interface Item extends EntityInfo<ItemId> {
        type: 'item'
      }

      export interface Property extends EntityInfo<PropertyId> {
        type: 'property'
      }

      export type Entity = Property | Item
      export type SimplifiedEntity = Property | Item
    `,
    )

    const traversal = new DependencyTraversal()
    const result = traversal.startTraversal(sourceFile)

    // EntityId should come before Entities
    const entityIdIndex = result.findIndex((node) => node.originalName === 'EntityId')
    const entitiesIndex = result.findIndex((node) => node.originalName === 'Entities')

    expect(entityIdIndex).toBeGreaterThanOrEqual(0)
    expect(entitiesIndex).toBeGreaterThanOrEqual(0)
    expect(entityIdIndex).toBeLessThan(entitiesIndex)

    // Entity should come before Entities
    const entityIndex = result.findIndex((node) => node.originalName === 'Entity')
    expect(entityIndex).toBeGreaterThanOrEqual(0)
    expect(entityIndex).toBeLessThan(entitiesIndex)

    // SimplifiedEntity should come before SimplifiedEntities
    const simplifiedEntityIndex = result.findIndex(
      (node) => node.originalName === 'SimplifiedEntity',
    )
    const simplifiedEntitiesIndex = result.findIndex(
      (node) => node.originalName === 'SimplifiedEntities',
    )
    expect(simplifiedEntityIndex).toBeGreaterThanOrEqual(0)
    expect(simplifiedEntitiesIndex).toBeGreaterThanOrEqual(0)
    expect(simplifiedEntityIndex).toBeLessThan(simplifiedEntitiesIndex)
  })
})
