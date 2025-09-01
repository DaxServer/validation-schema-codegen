import { resolverStore } from '@daxserver/validation-schema-codegen/utils/resolver-store'
import { createSourceFile, formatWithPrettier, generateFormattedCode } from '@test-fixtures/utils'
import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

describe('Ambiguous name resolution', () => {
  let project: Project

  beforeEach(() => {
    project = new Project()
    resolverStore.clear()
  })

  test('should disambiguate type resolution across multiple files', () => {
    // Create first file with User type
    createSourceFile(
      project,
      `
        export type User = {
          id: string;
          name: string;
        };
      `,
      'user-types.ts',
    )

    // Create second file with different User type
    createSourceFile(
      project,
      `
        export type User = {
          userId: number;
          email: string;
        };
      `,
      'admin-types.ts',
    )

    // Create main file that imports both and uses them
    const mainFile = createSourceFile(
      project,
      `
        import { User as UserType } from "./user-types";
        import { User as AdminUser } from "./admin-types";

        type UserProfile = {
          user: UserType;
          admin: AdminUser;
        };
      `,
    )

    const result = generateFormattedCode(mainFile)

    expect(result).toContain('UserProfile')
    expect(result).toBe(
      formatWithPrettier(
        `
        export const UserType = Type.Object({
          id: Type.String(),
          name: Type.String(),
        });

        export type UserType = Static<typeof UserType>

        export const AdminUser = Type.Object({
          userId: Type.Number(),
          email: Type.String(),
        });

        export type AdminUser = Static<typeof AdminUser>

        export const UserProfile = Type.Object({
          user: UserType,
          admin: AdminUser,
        });

        export type UserProfile = Static<typeof UserProfile>
      `,
      ),
    )
  })

  test('should disambiguate interface resolution across multiple files', () => {
    // Create first file with BaseEntity
    createSourceFile(
      project,
      `
        export interface BaseEntity {
          id: string;
          createdAt: Date;
        }
      `,
      'common-types.ts',
    )

    // Create second file with different BaseEntity
    createSourceFile(
      project,
      `
        export interface BaseEntity {
          entityId: number;
          version: number;
        }
      `,
      'legacy-types.ts',
    )

    // Create main file that extends both
    const mainFile = createSourceFile(
      project,
      `
        import { BaseEntity as CommonBase } from "./common-types";
        import { BaseEntity as LegacyBase } from "./legacy-types";

        interface ModernUser extends CommonBase {
          email: string;
        }

        interface LegacyUser extends LegacyBase {
          username: string;
        }
      `,
    )

    const result = generateFormattedCode(mainFile)

    expect(result).toContain('ModernUser')
    expect(result).toContain('LegacyUser')
    expect(result).toBe(
      formatWithPrettier(
        `
        export const CommonBase = Type.Object({
          id: Type.String(),
          createdAt: Type.Date(),
        });

        export type CommonBase = Static<typeof CommonBase>

        export const LegacyBase = Type.Object({
          entityId: Type.Number(),
          version: Type.Number(),
        });

        export type LegacyBase = Static<typeof LegacyBase>

        export const ModernUser = Type.Composite([
          CommonBase,
          Type.Object({
            email: Type.String(),
          }),
        ]);

        export type ModernUser = Static<typeof ModernUser>

        export const LegacyUser = Type.Composite([
          LegacyBase,
          Type.Object({
            username: Type.String(),
          }),
        ]);

        export type LegacyUser = Static<typeof LegacyUser>
      `,
      ),
    )
  })
})
