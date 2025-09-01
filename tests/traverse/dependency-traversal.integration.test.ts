import { DependencyTraversal } from '@daxserver/validation-schema-codegen/traverse/dependency-traversal'
import { resolverStore } from '@daxserver/validation-schema-codegen/utils/resolver-store'
import { createSourceFile, formatWithPrettier, generateFormattedCode } from '@test-fixtures/utils'
import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

describe('Dependency Traversal', () => {
  let project: Project
  let traverser: DependencyTraversal

  beforeEach(() => {
    project = new Project()
    traverser = new DependencyTraversal()
    resolverStore.clear()
  })

  describe('collectFromImports', () => {
    test('should collect dependencies from single import', () => {
      createSourceFile(
        project,
        `
          export type User = {
            id: string;
            name: string;
          };
        `,
        'external.ts',
      )

      const sourceFile = createSourceFile(
        project,
        `
          import { User } from "./external";

          type LocalType = {
            user: User;
          };
        `,
        'main.ts',
      )

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(`
          export const User = Type.Object({
            id: Type.String(),
            name: Type.String(),
          });
          
          export type User = Static<typeof User>;
          
          export const LocalType = Type.Object({
            user: User,
          });
          
          export type LocalType = Static<typeof LocalType>;
        `),
      )
    })

    test('should collect dependencies from multiple imports', () => {
      createSourceFile(
        project,
        `
          export type User = {
            id: string;
            name: string;
          };
        `,
        'user.ts',
      )

      createSourceFile(
        project,
        `
          export type Product = {
            id: string;
            title: string;
          };
        `,
        'product.ts',
      )

      const sourceFile = createSourceFile(
        project,
        `
          import { User } from "./user";
          import { Product } from "./product";

          type LocalType = {
            user: User;
            product: Product;
          };
        `,
        'main.ts',
      )

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(`
          export const User = Type.Object({
            id: Type.String(),
            name: Type.String(),
          });
          
          export type User = Static<typeof User>;
          
          export const Product = Type.Object({
            id: Type.String(),
            title: Type.String(),
          });
          
          export type Product = Static<typeof Product>;
          
          export const LocalType = Type.Object({
            user: User,
            product: Product,
          });
          
          export type LocalType = Static<typeof LocalType>;
        `),
      )
    })

    test('should handle nested imports', () => {
      createSourceFile(
        project,
        `
          export type BaseType = {
            id: string;
          };
        `,
        'base.ts',
      )

      createSourceFile(
        project,
        `
          import { BaseType } from "./base";
          export type User = BaseType & {
            name: string;
          };
        `,
        'user.ts',
      )

      const sourceFile = createSourceFile(
        project,
        `
          import { User } from "./user";

          type LocalType = {
            user: User;
          };
        `,
        'main.ts',
      )

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(`
          export const BaseType = Type.Object({
            id: Type.String(),
          });
          
          export type BaseType = Static<typeof BaseType>;
          
          export const User = Type.Intersect([
            BaseType,
            Type.Object({
              name: Type.String(),
            }),
          ]);
          
          export type User = Static<typeof User>;
          
          export const LocalType = Type.Object({
            user: User,
          });
          
          export type LocalType = Static<typeof LocalType>;
        `),
      )
    })

    test('should handle missing module specifier source file', () => {
      const sourceFile = createSourceFile(project, 'import { NonExistent } from "./non-existent";')

      traverser.startTraversal(sourceFile)
      const dependencies = traverser.getNodesToPrint()

      expect(dependencies).toHaveLength(0)
    })

    test('should not duplicate dependencies', () => {
      createSourceFile(
        project,
        `
          export type User = {
            id: string;
            name: string;
          };
        `,
        'user.ts',
      )

      const sourceFile = createSourceFile(
        project,
        `
          import { User } from "./user";
          import { User as UserAlias } from "./user";

          type LocalType = {
            user: User;
            userAlias: UserAlias;
          };
        `,
        'main.ts',
      )

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(`
          export const User = Type.Object({
            id: Type.String(),
            name: Type.String(),
          });
          
          export type User = Static<typeof User>;
          
          export const LocalType = Type.Object({
            user: User,
            userAlias: UserAlias,
          });
          
          export type LocalType = Static<typeof LocalType>;
        `),
      )
    })
  })

  describe('addLocalTypes', () => {
    test('should add local type aliases', () => {
      const sourceFile = createSourceFile(
        project,
        `
          type LocalUser = {
            id: string;
            name: string;
          };

          type LocalProduct = {
            id: string;
            title: string;
          };
        `,
      )

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(`
          export const LocalUser = Type.Object({
            id: Type.String(),
            name: Type.String(),
          });
          
          export type LocalUser = Static<typeof LocalUser>;
          
          export const LocalProduct = Type.Object({
            id: Type.String(),
            title: Type.String(),
          });
          
          export type LocalProduct = Static<typeof LocalProduct>;
        `),
      )
    })

    test('should not duplicate existing types', () => {
      const sourceFile = createSourceFile(
        project,
        `
          type User = {
            id: string;
            name: string;
          };
        `,
      )

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(`
          export const User = Type.Object({
            id: Type.String(),
            name: Type.String(),
          });
          
          export type User = Static<typeof User>;
        `),
      )
    })
  })

  describe('topological sorting', () => {
    test('should sort dependencies in correct order', () => {
      createSourceFile(
        project,
        `
          export type BaseType = {
            id: string;
          };
        `,
        'base.ts',
      )

      createSourceFile(
        project,
        `
          import { BaseType } from "./base";
          export type User = BaseType & {
            name: string;
          };
        `,
        'user.ts',
      )

      const sourceFile = createSourceFile(
        project,
        `
          import { User } from "./user";

          type LocalType = {
            user: User;
          };
        `,
        'main.ts',
      )

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(`
          export const BaseType = Type.Object({
            id: Type.String(),
          });
          
          export type BaseType = Static<typeof BaseType>;
          
          export const User = Type.Intersect([
            BaseType,
            Type.Object({
              name: Type.String(),
            }),
          ]);
          
          export type User = Static<typeof User>;
          
          export const LocalType = Type.Object({
            user: User,
          });
          
          export type LocalType = Static<typeof LocalType>;
        `),
      )
    })

    test('should handle complex dependency chains', () => {
      createSourceFile(
        project,
        `
          export type A = {
            value: string;
          };
        `,
        'a.ts',
      )

      createSourceFile(
        project,
        `
          import { A } from "./a";
          export type B = {
            a: A;
            name: string;
          };
        `,
        'b.ts',
      )

      createSourceFile(
        project,
        `
          import { B } from "./b";
          export type C = {
            b: B;
            id: number;
          };
        `,
        'c.ts',
      )

      const sourceFile = createSourceFile(
        project,
        `
          import { C } from "./c";

          type LocalType = {
            c: C;
          };
        `,
        'main.ts',
      )

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(`
          export const A = Type.Object({
            value: Type.String(),
          });
          
          export type A = Static<typeof A>;
          
          export const B = Type.Object({
            a: A,
            name: Type.String(),
          });
          
          export type B = Static<typeof B>;
          
          export const C = Type.Object({
            b: B,
            id: Type.Number(),
          });
          
          export type C = Static<typeof C>;
          
          export const LocalType = Type.Object({
            c: C,
          });
          
          export type LocalType = Static<typeof LocalType>;
        `),
      )
    })

    test('should handle circular dependencies gracefully', () => {
      createSourceFile(
        project,
        `
          import { B } from "./b";
          export type A = {
            b?: B;
            value: string;
          };
        `,
        'a.ts',
      )

      createSourceFile(
        project,
        `
          import { A } from "./a";
          export type B = {
            a?: A;
            name: string;
          };
        `,
        'b.ts',
      )

      const sourceFile = createSourceFile(
        project,
        `
          import { A } from "./a";
          import { B } from "./b";
        `,
        'main.ts',
      )

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(`
          export const A = Type.Object({
            b: Type.Optional(B),
            value: Type.String(),
          });
          
          export type A = Static<typeof A>;
          
          export const B = Type.Object({
            a: Type.Optional(A),
            name: Type.String(),
          });
          
          export type B = Static<typeof B>;
        `),
      )
    })

    test('should handle types with no dependencies', () => {
      createSourceFile(
        project,
        `
          export type SimpleType = {
            id: string;
            name: string;
          };
        `,
        'simple.ts',
      )

      const sourceFile = createSourceFile(
        project,
        `
          import { SimpleType } from "./simple";

          type LocalType = {
            simple: SimpleType;
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
          
          export const LocalType = Type.Object({
            simple: SimpleType,
          });
          
          export type LocalType = Static<typeof LocalType>;
        `),
      )
    })
  })

  describe('mixed local and imported types', () => {
    test('should handle both local and imported types correctly', () => {
      createSourceFile(
        project,
        `
          export type ExternalType = {
            id: string;
          };
        `,
        'external.ts',
      )

      const sourceFile = createSourceFile(
        project,
        `
          import { ExternalType } from "./external";

          type LocalType = {
            external: ExternalType;
            local: string;
          };
        `,
        'main.ts',
      )

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(`
          export const ExternalType = Type.Object({
            id: Type.String(),
          });
          
          export type ExternalType = Static<typeof ExternalType>;
          
          export const LocalType = Type.Object({
            external: ExternalType,
            local: Type.String(),
          });
          
          export type LocalType = Static<typeof LocalType>;
        `),
      )
    })
  })
})
