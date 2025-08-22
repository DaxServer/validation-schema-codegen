import { formatWithPrettier, generateFormattedCode } from '@test-fixtures/utils'
import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

describe('Dependency Ordering Bug', () => {
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

    expect(generateFormattedCode(sourceFile, true)).resolves.toBe(
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

    expect(generateFormattedCode(sourceFile, true)).resolves.toBe(
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
           "'string'": StringSnakDataValue,
           "'commonsMedia'": CommonsMediaSnakDataValue,
           "'external-id'": ExternalIdSnakDataValue,
           "'geo-shape'": GeoShapeSnakDataValue,
         });

        export type DataValueByDataType = Static<typeof DataValueByDataType>;
      `),
    )
  })
})
