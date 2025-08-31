import { createSourceFile, formatWithPrettier, generateFormattedCode } from '@test-fixtures/utils'
import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

describe('ts-morph codegen with imports', () => {
  let project: Project

  beforeEach(() => {
    project = new Project()
  })

  describe('without exports', () => {
    test('should resolve imported types', () => {
      createSourceFile(
        project,
        `
          export type ExternalType = {
            value: string;
          };
        `,
        'external-types.ts',
      )

      const userFile = createSourceFile(
        project,
        `
          import { ExternalType } from "./external-types";

          type User = {
            id: string;
            name: string;
            local: string;
            external: ExternalType;
          };
        `,
      )

      expect(generateFormattedCode(userFile)).toBe(
        formatWithPrettier(`
          export const ExternalType = Type.Object({
            value: Type.String(),
          })

          export type ExternalType = Static<typeof ExternalType>

          export const User = Type.Object({
            id: Type.String(),
            name: Type.String(),
            local: Type.String(),
            external: ExternalType,
          })

          export type User = Static<typeof User>
        `),
      )
    })

    test('should resolve imported types from a package', () => {
      createSourceFile(
        project,
        `
          export type ExternalType = {
            value: string;
          };
        `,
        'node_modules/some-package/external-types.ts',
      )

      const userFile = createSourceFile(
        project,
        `
          import { ExternalType } from "some-package/external-types";

          type User = {
            id: string;
            name: string;
            local: string;
            external: ExternalType;
          };
        `,
      )

      expect(generateFormattedCode(userFile)).toBe(
        formatWithPrettier(`
          export const ExternalType = Type.Object({
            value: Type.String(),
          })

          export type ExternalType = Static<typeof ExternalType>

          export const User = Type.Object({
            id: Type.String(),
            name: Type.String(),
            local: Type.String(),
            external: ExternalType,
          })

          export type User = Static<typeof User>
        `),
      )
    })

    test('should resolve types from an imported file that imports another file', () => {
      createSourceFile(
        project,
        `
          export type DeeplyNestedType = {
            value: boolean;
          };
        `,
        'deeply-nested-types.ts',
      )

      createSourceFile(
        project,
        `
          import { DeeplyNestedType } from "./deeply-nested-types";

          export type IntermediateType = {
            id: string;
            nested: DeeplyNestedType;
          };
        `,
        'intermediate-types.ts',
      )

      const userFile = createSourceFile(
        project,
        `
          import { IntermediateType } from "./intermediate-types";

          type FinalUser = {
            name: string;
            data: IntermediateType;
          };
        `,
      )

      expect(generateFormattedCode(userFile)).toBe(
        formatWithPrettier(`
          export const DeeplyNestedType = Type.Object({
            value: Type.Boolean(),
          })

          export type DeeplyNestedType = Static<typeof DeeplyNestedType>

          export const IntermediateType = Type.Object({
            id: Type.String(),
            nested: DeeplyNestedType,
          })

          export type IntermediateType = Static<typeof IntermediateType>

          export const FinalUser = Type.Object({
            name: Type.String(),
            data: IntermediateType,
          })

          export type FinalUser = Static<typeof FinalUser>
        `),
      )
    })

    test('should resolve types from a four-level nested import chain', () => {
      createSourceFile(
        project,
        `
          export type VeryDeeplyNestedType = {
            core: string;
          };
        `,
        'very-deeply-nested-types.ts',
      )

      createSourceFile(
        project,
        `
          import { VeryDeeplyNestedType } from "./very-deeply-nested-types";

          export type DeeplyNestedType = {
            value: boolean;
            veryDeep: VeryDeeplyNestedType;
          };
        `,
        'deeply-nested-types.ts',
      )

      createSourceFile(
        project,
        `
          import { DeeplyNestedType } from "./deeply-nested-types";

          export type IntermediateType = {
            id: string;
            nested: DeeplyNestedType;
          };
        `,
        'intermediate-types.ts',
      )

      const userFile = createSourceFile(
        project,
        `
          import { IntermediateType } from "./intermediate-types";

          type UltimateUser = {
            name: string;
            data: IntermediateType;
          };
        `,
      )

      expect(generateFormattedCode(userFile)).toBe(
        formatWithPrettier(`
          export const VeryDeeplyNestedType = Type.Object({
            core: Type.String(),
          })

          export type VeryDeeplyNestedType = Static<typeof VeryDeeplyNestedType>

          export const DeeplyNestedType = Type.Object({
            value: Type.Boolean(),
            veryDeep: VeryDeeplyNestedType,
          })

          export type DeeplyNestedType = Static<typeof DeeplyNestedType>

          export const IntermediateType = Type.Object({
            id: Type.String(),
            nested: DeeplyNestedType,
          })

          export type IntermediateType = Static<typeof IntermediateType>

          export const UltimateUser = Type.Object({
            name: Type.String(),
            data: IntermediateType,
          })

          export type UltimateUser = Static<typeof UltimateUser>
        `),
      )
    })
  })

  describe('with exports', () => {
    test('should resolve imported types', () => {
      createSourceFile(
        project,
        `
          export type ExternalType = {
            value: string;
          };
        `,
        'external-types.ts',
      )

      const userFile = createSourceFile(
        project,
        `
          import { ExternalType } from "./external-types";

          export type User = {
            id: string;
            name: string;
            local: string;
            external: ExternalType;
          };
        `,
      )

      expect(generateFormattedCode(userFile)).toBe(
        formatWithPrettier(`
          export const ExternalType = Type.Object({
            value: Type.String(),
          })

          export type ExternalType = Static<typeof ExternalType>

          export const User = Type.Object({
            id: Type.String(),
            name: Type.String(),
            local: Type.String(),
            external: ExternalType,
          })

          export type User = Static<typeof User>
        `),
      )
    })

    test('should resolve imported types from a package', () => {
      createSourceFile(
        project,
        `
          export type ExternalType = {
            value: string;
          };
        `,
        'node_modules/some-package/external-types.ts',
      )

      const userFile = createSourceFile(
        project,
        `
          import { ExternalType } from "some-package/external-types";

          export type User = {
            id: string;
            name: string;
            local: string;
            external: ExternalType;
          };
        `,
      )

      expect(generateFormattedCode(userFile)).toBe(
        formatWithPrettier(`
          export const ExternalType = Type.Object({
            value: Type.String(),
          })

          export type ExternalType = Static<typeof ExternalType>

          export const User = Type.Object({
            id: Type.String(),
            name: Type.String(),
            local: Type.String(),
            external: ExternalType,
          })

          export type User = Static<typeof User>
        `),
      )
    })

    test('should resolve types from an imported file that imports another file', () => {
      createSourceFile(
        project,
        `
          export type DeeplyNestedType = {
            value: boolean;
          };
        `,
        'deeply-nested-types.ts',
      )

      createSourceFile(
        project,
        `
          import { DeeplyNestedType } from "./deeply-nested-types";

          export type IntermediateType = {
            id: string;
            nested: DeeplyNestedType;
          };
        `,
        'intermediate-types.ts',
      )

      const userFile = createSourceFile(
        project,
        `
          import { IntermediateType } from "./intermediate-types";

          export type FinalUser = {
            name: string;
            data: IntermediateType;
          };
        `,
      )

      expect(generateFormattedCode(userFile)).toBe(
        formatWithPrettier(`
          export const DeeplyNestedType = Type.Object({
            value: Type.Boolean(),
          })

          export type DeeplyNestedType = Static<typeof DeeplyNestedType>

          export const IntermediateType = Type.Object({
            id: Type.String(),
            nested: DeeplyNestedType,
          })

          export type IntermediateType = Static<typeof IntermediateType>

          export const FinalUser = Type.Object({
            name: Type.String(),
            data: IntermediateType,
          })

          export type FinalUser = Static<typeof FinalUser>
        `),
      )
    })

    test('should resolve types from a four-level nested import chain', () => {
      createSourceFile(
        project,
        `
          export type VeryDeeplyNestedType = {
            core: string;
          };
        `,
        'very-deeply-nested-types.ts',
      )

      createSourceFile(
        project,
        `
          import { VeryDeeplyNestedType } from "./very-deeply-nested-types";

          export type DeeplyNestedType = {
            value: boolean;
            veryDeep: VeryDeeplyNestedType;
          };
        `,
        'deeply-nested-types.ts',
      )

      createSourceFile(
        project,
        `
          import { DeeplyNestedType } from "./deeply-nested-types";

          export type IntermediateType = {
            id: string;
            nested: DeeplyNestedType;
          };
        `,
        'intermediate-types.ts',
      )

      const userFile = createSourceFile(
        project,
        `
          import { IntermediateType } from "./intermediate-types";

          export type UltimateUser = {
            name: string;
            data: IntermediateType;
          };
        `,
      )

      expect(generateFormattedCode(userFile)).toBe(
        formatWithPrettier(`
          export const VeryDeeplyNestedType = Type.Object({
            core: Type.String(),
          })

          export type VeryDeeplyNestedType = Static<typeof VeryDeeplyNestedType>

          export const DeeplyNestedType = Type.Object({
            value: Type.Boolean(),
            veryDeep: VeryDeeplyNestedType,
          })

          export type DeeplyNestedType = Static<typeof DeeplyNestedType>

          export const IntermediateType = Type.Object({
            id: Type.String(),
            nested: DeeplyNestedType,
          })

          export type IntermediateType = Static<typeof IntermediateType>

          export const UltimateUser = Type.Object({
            name: Type.String(),
            data: IntermediateType,
          })

          export type UltimateUser = Static<typeof UltimateUser>
        `),
      )
    })
  })
})
