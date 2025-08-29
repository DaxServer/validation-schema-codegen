import { DependencyTraversal } from '@daxserver/validation-schema-codegen/traverse/dependency-traversal'
import type { TraversedNode } from '@daxserver/validation-schema-codegen/traverse/types'
import { createSourceFile } from '@test-fixtures/utils'
import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

const getNodeName = (traversedNode: TraversedNode): string => {
  return traversedNode.originalName
}

describe('Dependency Traversal', () => {
  let project: Project
  let traverser: DependencyTraversal

  beforeEach(() => {
    project = new Project()
    traverser = new DependencyTraversal()
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

      const mainFile = createSourceFile(project, 'import { User } from "./external";', 'main.ts')

      traverser.startTraversal(mainFile)
      const dependencies = traverser.getNodesToPrint()

      expect(dependencies).toHaveLength(1)
      expect(getNodeName(dependencies[0]!)).toBe('User')
      expect(dependencies[0]!.isImported).toBe(true)
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

      const mainFile = createSourceFile(
        project,
        `
          import { User } from "./user";
          import { Product } from "./product";
        `,
        'main.ts',
      )

      traverser.startTraversal(mainFile)
      const dependencies = traverser.getNodesToPrint()

      expect(dependencies).toHaveLength(2)
      const typeNames = dependencies.map((d) => getNodeName(d))
      expect(typeNames).toContain('User')
      expect(typeNames).toContain('Product')
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

      const mainFile = createSourceFile(project, 'import { User } from "./user";', 'main.ts')

      traverser.startTraversal(mainFile)
      const dependencies = traverser.getNodesToPrint()

      expect(dependencies).toHaveLength(2)
      const typeNames = dependencies.map((d) => getNodeName(d))
      expect(typeNames).toContain('BaseType')
      expect(typeNames).toContain('User')
    })

    test('should handle missing module specifier source file', () => {
      const mainFile = createSourceFile(
        project,
        'import { NonExistent } from "./non-existent";',
        'main.ts',
      )

      traverser.startTraversal(mainFile)
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

      const mainFile = createSourceFile(
        project,
        `
          import { User } from "./user";
          import { User as UserAlias } from "./user";
        `,
        'main.ts',
      )

      traverser.startTraversal(mainFile)
      const dependencies = traverser.getNodesToPrint()

      expect(dependencies).toHaveLength(1)
      expect(getNodeName(dependencies[0]!)).toBe('User')
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

      traverser.startTraversal(sourceFile)
      const dependencies = traverser.getNodesToPrint()

      expect(dependencies).toHaveLength(2)
      const typeNames = dependencies.map((d) => getNodeName(d))
      expect(typeNames).toContain('LocalUser')
      expect(typeNames).toContain('LocalProduct')

      dependencies.forEach((dep) => {
        expect(dep!.isImported).toBe(false)
      })
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

      traverser.addLocalTypes(sourceFile)
      traverser.addLocalTypes(sourceFile)
      const dependencies = traverser.getNodesToPrint()

      expect(dependencies).toHaveLength(1)
      expect(getNodeName(dependencies[0]!)).toBe('User')
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

      const mainFile = createSourceFile(project, 'import { User } from "./user";', 'main.ts')

      traverser.startTraversal(mainFile)
      const dependencies = traverser.getNodesToPrint()

      expect(dependencies).toHaveLength(2)
      expect(getNodeName(dependencies[0]!)).toBe('BaseType')
      expect(getNodeName(dependencies[1]!)).toBe('User')
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

      const mainFile = createSourceFile(project, 'import { C } from "./c";', 'main.ts')

      traverser.startTraversal(mainFile)
      const dependencies = traverser.getNodesToPrint()

      expect(dependencies).toHaveLength(3)
      expect(getNodeName(dependencies[0]!)).toBe('A')
      expect(getNodeName(dependencies[1]!)).toBe('B')
      expect(getNodeName(dependencies[2]!)).toBe('C')
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

      const mainFile = createSourceFile(
        project,
        `
          import { A } from "./a";
          import { B } from "./b";
        `,
        'main.ts',
      )

      traverser.startTraversal(mainFile)
      const dependencies = traverser.getNodesToPrint()

      expect(dependencies).toHaveLength(2)
      const typeNames = dependencies.map((d) => getNodeName(d))
      expect(typeNames).toContain('A')
      expect(typeNames).toContain('B')
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

      const mainFile = createSourceFile(
        project,
        'import { SimpleType } from "./simple";',
        'main.ts',
      )

      traverser.startTraversal(mainFile)
      const dependencies = traverser.getNodesToPrint()

      expect(dependencies).toHaveLength(1)
      expect(getNodeName(dependencies[0]!)).toBe('SimpleType')
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

      const mainFile = createSourceFile(
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

      traverser.startTraversal(mainFile)
      const dependencies = traverser.getNodesToPrint()

      expect(dependencies).toHaveLength(2)

      const externalDep = dependencies.find((d) => getNodeName(d) === 'ExternalType')
      const localDep = dependencies.find((d) => getNodeName(d) === 'LocalType')

      expect(externalDep!.isImported).toBe(true)
      expect(localDep!.isImported).toBe(false)

      expect(getNodeName(dependencies[0]!)).toBe('ExternalType')
      expect(getNodeName(dependencies[1]!)).toBe('LocalType')
    })
  })
})
