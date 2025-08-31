import { createSourceFile, formatWithPrettier, generateFormattedCode } from '@test-fixtures/utils'
import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

describe('Maincode Filter', () => {
  let project: Project

  beforeEach(() => {
    project = new Project()
  })

  test('should filter to only maincode nodes and their dependencies', () => {
    // Create external dependencies that are NOT used by maincode
    createSourceFile(
      project,
      `
        export type UnusedExternal = {
          id: string;
        };
      `,
      'unused.ts',
    )

    // Create external dependencies that ARE used by maincode
    createSourceFile(
      project,
      `
        export type UsedExternal = {
          value: string;
        };
      `,
      'used.ts',
    )

    // Create a dependency chain: Base -> Intermediate -> UsedExternal
    createSourceFile(
      project,
      `
        export type Base = {
          id: string;
        };
      `,
      'base.ts',
    )

    createSourceFile(
      project,
      `
        import { Base } from "./base";
        export type Intermediate = Base & {
          name: string;
        };
      `,
      'intermediate.ts',
    )

    const sourceFile = createSourceFile(
      project,
      `
        import { UsedExternal } from "./used";
        import { Intermediate } from "./intermediate";
        import { UnusedExternal } from "./unused";

        // This is maincode and uses UsedExternal and Intermediate
        export interface MainType {
          used: UsedExternal;
          intermediate: Intermediate;
        }

        // This is also maincode but doesn't use any imports
        export type SimpleMainType = {
          id: string;
          name: string;
        };

        // UnusedExternal is imported but not used in any maincode types
      `,
      'main.ts',
    )

    expect(generateFormattedCode(sourceFile)).toBe(
      formatWithPrettier(`
        export const SimpleMainType = Type.Object({
          id: Type.String(),
          name: Type.String(),
        });

        export type SimpleMainType = Static<typeof SimpleMainType>;

        export const UsedExternal = Type.Object({
          value: Type.String(),
        });

        export type UsedExternal = Static<typeof UsedExternal>;

        export const Base = Type.Object({
          id: Type.String(),
        });

        export type Base = Static<typeof Base>;

        export const Intermediate = Type.Intersect([Base, Type.Object({
          name: Type.String(),
        })]);

        export type Intermediate = Static<typeof Intermediate>;

        export const MainType = Type.Object({
          used: UsedExternal,
          intermediate: Intermediate,
        });

        export type MainType = Static<typeof MainType>;
      `),
    )
  })

  test('should handle maincode with no dependencies', () => {
    const sourceFile = createSourceFile(
      project,
      `
        export type SimpleType = {
          id: string;
          name: string;
        };
      `,
      'main.ts',
    )

    expect(generateFormattedCode(sourceFile)).toBe(
      formatWithPrettier(`
        export const SimpleType = Type.Object({
          id: Type.String(),
          name: Type.String(),
        });

        export type SimpleType = Static<typeof SimpleType>;
      `),
    )
  })

  test('should handle complex dependency chains from maincode', () => {
    // Create a deep dependency chain
    createSourceFile(
      project,
      `
        export type Level1 = {
          value: string;
        };
      `,
      'level1.ts',
    )

    createSourceFile(
      project,
      `
        import { Level1 } from "./level1";
        export type Level2 = {
          level1: Level1;
          name: string;
        };
      `,
      'level2.ts',
    )

    createSourceFile(
      project,
      `
        import { Level2 } from "./level2";
        export type Level3 = {
          level2: Level2;
          id: number;
        };
      `,
      'level3.ts',
    )

    // Create an unused import
    createSourceFile(
      project,
      `
        export type Unused = {
          unused: boolean;
        };
      `,
      'unused.ts',
    )

    const sourceFile = createSourceFile(
      project,
      `
        import { Level3 } from "./level3";
        import { Unused } from "./unused";

        export interface MainInterface {
          data: Level3;
        }
      `,
      'main.ts',
    )

    expect(generateFormattedCode(sourceFile)).toBe(
      formatWithPrettier(`
        export const Level1 = Type.Object({
          value: Type.String(),
        });

        export type Level1 = Static<typeof Level1>;

        export const Level2 = Type.Object({
          level1: Level1,
          name: Type.String(),
        });

        export type Level2 = Static<typeof Level2>;

        export const Level3 = Type.Object({
          level2: Level2,
          id: Type.Number(),
        });

        export type Level3 = Static<typeof Level3>;

        export const MainInterface = Type.Object({
          data: Level3,
        });

        export type MainInterface = Static<typeof MainInterface>;
      `),
    )
  })
})
