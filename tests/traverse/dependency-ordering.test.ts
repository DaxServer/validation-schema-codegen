import { DependencyTraversal } from '@daxserver/validation-schema-codegen/traverse/dependency-traversal'
import { createSourceFile, formatWithPrettier, generateFormattedCode } from '@test-fixtures/utils'
import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

describe('Dependency ordering', () => {
  let project: Project

  beforeEach(() => {
    project = new Project()
  })

  test('should define StringSnakDataValue before using it', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
        export type CommonsMediaSnakDataValue = StringSnakDataValue;
        export type StringSnakDataValue = {
          value: string;
          type: 'string';
        };
      `,
    )

    expect(generateFormattedCode(sourceFile, true)).toBe(
      formatWithPrettier(`
        export const StringSnakDataValue = Type.Object({
          value: Type.String(),
          type: Type.Literal('string'),
        });

        export type StringSnakDataValue = Static<typeof StringSnakDataValue>;

        export const CommonsMediaSnakDataValue = StringSnakDataValue;

        export type CommonsMediaSnakDataValue = Static<typeof CommonsMediaSnakDataValue>;
      `),
    )
  })

  test('should handle complex dependency chains correctly', () => {
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
        export type CommonsMediaSnakDataValue = StringSnakDataValue;
        export type ExternalIdSnakDataValue = StringSnakDataValue;
        export type GeoShapeSnakDataValue = StringSnakDataValue;
        export type StringSnakDataValue = {
          value: string;
          type: 'string';
        };
        export type DataValueByDataType = {
          'string': StringSnakDataValue;
          'commonsMedia': CommonsMediaSnakDataValue;
          'external-id': ExternalIdSnakDataValue;
          'geo-shape': GeoShapeSnakDataValue;
        };
      `,
    )

    expect(generateFormattedCode(sourceFile, true)).toBe(
      formatWithPrettier(`
        export const StringSnakDataValue = Type.Object({
          value: Type.String(),
          type: Type.Literal('string'),
        });

        export type StringSnakDataValue = Static<typeof StringSnakDataValue>;

        export const CommonsMediaSnakDataValue = StringSnakDataValue;

        export type CommonsMediaSnakDataValue = Static<typeof CommonsMediaSnakDataValue>;

        export const ExternalIdSnakDataValue = StringSnakDataValue;

        export type ExternalIdSnakDataValue = Static<typeof ExternalIdSnakDataValue>;

        export const GeoShapeSnakDataValue = StringSnakDataValue;

        export type GeoShapeSnakDataValue = Static<typeof GeoShapeSnakDataValue>;

        export const DataValueByDataType = Type.Object({
          string: StringSnakDataValue,
          commonsMedia: CommonsMediaSnakDataValue,
          'external-id': ExternalIdSnakDataValue,
          'geo-shape': GeoShapeSnakDataValue,
        });

        export type DataValueByDataType = Static<typeof DataValueByDataType>;
      `),
    )
  })

  test('should order dependencies correctly - referenced types before referencing types', () => {
    // Create a simple test case where TypeB depends on TypeA
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
        export type TypeB = TypeA
        export type TypeA = string
      `,
    )

    const traversal = new DependencyTraversal()
    const result = traversal.startTraversal(sourceFile)

    // TypeA should come before TypeB in the result
    const typeAIndex = result.findIndex((node) => node.originalName === 'TypeA')
    const typeBIndex = result.findIndex((node) => node.originalName === 'TypeB')

    expect(typeAIndex).toBeGreaterThanOrEqual(0)
    expect(typeBIndex).toBeGreaterThanOrEqual(0)
    expect(typeAIndex).toBeLessThan(typeBIndex)
  })

  test('should handle complex dependency chains', () => {
    // Create a more complex dependency chain
    const sourceFile = project.createSourceFile(
      'test.ts',
      `
        export type EntityInfo = {
          id: EntityId
          name: string
        }

        export type EntityId = string

        export type Entities = Record<EntityId, Entity>

        export type Entity = {
          info: EntityInfo
          type: string
        }
      `,
    )

    const traversal = new DependencyTraversal()
    const result = traversal.startTraversal(sourceFile)

    // EntityId should come before EntityInfo, EntityInfo should come before Entity, Entity should come before Entities
    const entityIdIndex = result.findIndex((node) => node.originalName === 'EntityId')
    const entityInfoIndex = result.findIndex((node) => node.originalName === 'EntityInfo')
    const entityIndex = result.findIndex((node) => node.originalName === 'Entity')
    const entitiesIndex = result.findIndex((node) => node.originalName === 'Entities')

    expect(entityIdIndex).toBeLessThan(entityInfoIndex)
    expect(entityInfoIndex).toBeLessThan(entityIndex)
    expect(entityIndex).toBeLessThan(entitiesIndex)
  })

  test('should handle complex structure without including unused types', () => {
    const project = new Project()

    // Create external dependency files
    createSourceFile(
      project,
      `
        export type DataType = 'string' | 'url' | 'wikibase-item'
        export type Claims = Record<string, any>
      `,
      'claim.ts',
    )

    createSourceFile(
      project,
      `
        export type Labels = Record<string, string>
        export type Descriptions = Record<string, string>
        export type Aliases = Record<string, string[]>
      `,
      'terms.ts',
    )

    createSourceFile(
      project,
      `
        export type Sitelinks = Record<string, any>
        export type UnusedSitelinkType = { unused: boolean } // Should not be included
      `,
      'sitelinks.ts',
    )

    const sourceFile = createSourceFile(
      project,
      `
        import type { DataType, Claims } from './claim'
        import type { Labels, Descriptions, Aliases } from './terms'
        import type { Sitelinks } from './sitelinks'

        type NumericId = \`\${number}\`
        type ItemId = \`Q\${number}\`
        type PropertyId = \`P\${number}\`
        type EntityId = ItemId | PropertyId

        interface EntityInfo<T> {
          id: T
          title?: string
          modified?: string
        }

        interface Property extends EntityInfo<PropertyId> {
          type: 'property'
          datatype?: DataType
          labels?: Labels
          descriptions?: Descriptions
          aliases?: Aliases
          claims?: Claims
        }

        interface Item extends EntityInfo<ItemId> {
          type: 'item'
          labels?: Labels
          descriptions?: Descriptions
          aliases?: Aliases
          claims?: Claims
          sitelinks?: Sitelinks
        }

        type Entity = Property | Item
        type Entities = Record<EntityId, Entity>
      `,
    )

    expect(generateFormattedCode(sourceFile)).toBe(
      formatWithPrettier(
        `
        export const NumericId = Type.TemplateLiteral([Type.Number()])

        export type NumericId = Static<typeof NumericId>

        export const ItemId = Type.TemplateLiteral([Type.Literal('Q'), Type.Number()])

        export type ItemId = Static<typeof ItemId>

        export const PropertyId = Type.TemplateLiteral([Type.Literal('P'), Type.Number()])

        export type PropertyId = Static<typeof PropertyId>

        export const EntityInfo = <T extends TSchema>(T: T) => Type.Object({
          id: T,
          title: Type.Optional(Type.String()),
          modified: Type.Optional(Type.String()),
        })

        export type EntityInfo<T extends TSchema> = Static<ReturnType<typeof EntityInfo<T>>>

        export const DataType = Type.Union([
          Type.Literal('string'),
          Type.Literal('url'),
          Type.Literal('wikibase-item'),
        ])

        export type DataType = Static<typeof DataType>

        export const Claims = Type.Record(Type.String(), Type.Any())

        export type Claims = Static<typeof Claims>

        export const Labels = Type.Record(Type.String(), Type.String())

        export type Labels = Static<typeof Labels>

        export const Descriptions = Type.Record(Type.String(), Type.String())

        export type Descriptions = Static<typeof Descriptions>

        export const Aliases = Type.Record(Type.String(), Type.Array(Type.String()))

        export type Aliases = Static<typeof Aliases>

        export const Sitelinks = Type.Record(Type.String(), Type.Any())

        export type Sitelinks = Static<typeof Sitelinks>

        export const EntityId = Type.Union([ItemId, PropertyId])

        export type EntityId = Static<typeof EntityId>

        export const Property = Type.Composite([
          EntityInfo(PropertyId),
          Type.Object({
            type: Type.Literal('property'),
            datatype: Type.Optional(DataType),
            labels: Type.Optional(Labels),
            descriptions: Type.Optional(Descriptions),
            aliases: Type.Optional(Aliases),
            claims: Type.Optional(Claims),
          }),
        ])

        export type Property = Static<typeof Property>

        export const Item = Type.Composite([
          EntityInfo(ItemId),
          Type.Object({
            type: Type.Literal('item'),
            labels: Type.Optional(Labels),
            descriptions: Type.Optional(Descriptions),
            aliases: Type.Optional(Aliases),
            claims: Type.Optional(Claims),
            sitelinks: Type.Optional(Sitelinks),
          }),
        ])

        export type Item = Static<typeof Item>

        export const Entity = Type.Union([Property, Item])

        export type Entity = Static<typeof Entity>

        export const Entities = Type.Record(EntityId, Entity)

        export type Entities = Static<typeof Entities>
      `,
        true,
        true,
      ),
    )
  })

  test('should handle circular references', () => {
    const project = new Project()

    const sourceFile = createSourceFile(
      project,
      `
        type Entities = Record<EntityId, Entity>
        type SimplifiedEntities = Record<EntityId, SimplifiedEntity>

        interface EntityInfo<T> {
          id: T
        }

        type EntityId = ItemId | PropertyId
        type ItemId = \`Q\${number}\`
        type PropertyId = \`P\${number}\`

        interface Item extends EntityInfo<ItemId> {
          type: 'item'
        }

        interface Property extends EntityInfo<PropertyId> {
          type: 'property'
        }

        type Entity = Property | Item
        type SimplifiedEntity = Property | Item
      `,
    )

    expect(generateFormattedCode(sourceFile)).toBe(
      formatWithPrettier(
        `
        export const ItemId = Type.TemplateLiteral([Type.Literal('Q'), Type.Number()])

        export type ItemId = Static<typeof ItemId>

        export const PropertyId = Type.TemplateLiteral([Type.Literal('P'), Type.Number()])

        export type PropertyId = Static<typeof PropertyId>

        export const EntityInfo = <T extends TSchema>(T: T) => Type.Object({
          id: T,
        })

        export type EntityInfo<T extends TSchema> = Static<ReturnType<typeof EntityInfo<T>>>

        export const EntityId = Type.Union([ItemId, PropertyId])

        export type EntityId = Static<typeof EntityId>

        export const Item = Type.Composite([
          EntityInfo(ItemId),
          Type.Object({
            type: Type.Literal('item'),
          }),
        ])

        export type Item = Static<typeof Item>

        export const Property = Type.Composite([
          EntityInfo(PropertyId),
          Type.Object({
            type: Type.Literal('property'),
          }),
        ])

        export type Property = Static<typeof Property>

        export const Entity = Type.Union([Property, Item])

        export type Entity = Static<typeof Entity>

        export const SimplifiedEntity = Type.Union([Property, Item])

        export type SimplifiedEntity = Static<typeof SimplifiedEntity>

        export const Entities = Type.Record(EntityId, Entity)

        export type Entities = Static<typeof Entities>

        export const SimplifiedEntities = Type.Record(EntityId, SimplifiedEntity)

        export type SimplifiedEntities = Static<typeof SimplifiedEntities>
      `,
        true,
        true,
      ),
    )
  })
})
