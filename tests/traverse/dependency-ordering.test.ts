import { DependencyTraversal } from '@daxserver/validation-schema-codegen/traverse/dependency-traversal'
import { formatWithPrettier, generateFormattedCode } from '@test-fixtures/utils'
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
})
