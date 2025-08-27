// import { DependencyCollector } from '@daxserver/validation-schema-codegen/traverse/dependency-collector'
// import { createSourceFile } from '@test-fixtures/utils'
// import { beforeEach, describe, expect, test } from 'bun:test'
// import { Project } from 'ts-morph'

// describe('DependencyCollector', () => {
//   let project: Project
//   let collector: DependencyCollector

//   beforeEach(() => {
//     project = new Project()
//     collector = new DependencyCollector()
//     DependencyCollector.clearGlobalCache()
//   })

//   describe('collectFromImports', () => {
//     test('should collect dependencies from single import', () => {
//       const externalFile = createSourceFile(
//         project,
//         `
//         export type User = {
//           id: string;
//           name: string;
//         };
//         `,
//         'external.ts',
//       )

//       const mainFile = createSourceFile(
//         project,
//         `
//         import { User } from "./external";
//         `,
//         'main.ts',
//       )

//       const importDeclarations = mainFile.getImportDeclarations()
//       const dependencies = collector.collectFromImports(importDeclarations)

//       expect(dependencies).toHaveLength(1)
//       expect(dependencies[0]!.typeAlias.getName()).toBe('User')
//       expect(dependencies[0]!.isImported).toBe(true)
//       expect(dependencies[0]!.sourceFile).toBe(externalFile)
//     })

//     test('should collect dependencies from multiple imports', () => {
//       createSourceFile(
//         project,
//         `
//         export type User = {
//           id: string;
//           name: string;
//         };
//         `,
//         'user.ts',
//       )

//       createSourceFile(
//         project,
//         `
//         export type Product = {
//           id: string;
//           title: string;
//         };
//         `,
//         'product.ts',
//       )

//       const mainFile = createSourceFile(
//         project,
//         `
//         import { User } from "./user";
//         import { Product } from "./product";
//         `,
//         'main.ts',
//       )

//       const importDeclarations = mainFile.getImportDeclarations()
//       const dependencies = collector.collectFromImports(importDeclarations)

//       expect(dependencies).toHaveLength(2)
//       const typeNames = dependencies.map((d) => d.typeAlias.getName())
//       expect(typeNames).toContain('User')
//       expect(typeNames).toContain('Product')
//     })

//     test('should handle nested imports', () => {
//       createSourceFile(
//         project,
//         `
//         export type BaseType = {
//           id: string;
//         };
//         `,
//         'base.ts',
//       )

//       createSourceFile(
//         project,
//         `
//         import { BaseType } from "./base";
//         export type User = BaseType & {
//           name: string;
//         };
//         `,
//         'user.ts',
//       )

//       const mainFile = createSourceFile(
//         project,
//         `
//         import { User } from "./user";
//         `,
//         'main.ts',
//       )

//       const importDeclarations = mainFile.getImportDeclarations()
//       const dependencies = collector.collectFromImports(importDeclarations)

//       expect(dependencies).toHaveLength(2)
//       const typeNames = dependencies.map((d) => d.typeAlias.getName())
//       expect(typeNames).toContain('BaseType')
//       expect(typeNames).toContain('User')
//     })

//     test('should handle missing module specifier source file', () => {
//       const mainFile = createSourceFile(
//         project,
//         `
//         import { NonExistent } from "./non-existent";
//         `,
//         'main.ts',
//       )

//       const importDeclarations = mainFile.getImportDeclarations()
//       const dependencies = collector.collectFromImports(importDeclarations)

//       expect(dependencies).toHaveLength(0)
//     })

//     test('should not duplicate dependencies', () => {
//       createSourceFile(
//         project,
//         `
//         export type User = {
//           id: string;
//           name: string;
//         };
//         `,
//         'user.ts',
//       )

//       const mainFile = createSourceFile(
//         project,
//         `
//         import { User } from "./user";
//         import { User as UserAlias } from "./user";
//         `,
//         'main.ts',
//       )

//       const importDeclarations = mainFile.getImportDeclarations()
//       const dependencies = collector.collectFromImports(importDeclarations)

//       expect(dependencies).toHaveLength(1)
//       expect(dependencies[0]!.typeAlias.getName()).toBe('User')
//     })
//   })

//   describe('addLocalTypes', () => {
//     test('should add local type aliases', () => {
//       const sourceFile = createSourceFile(
//         project,
//         `
//         type LocalUser = {
//           id: string;
//           name: string;
//         };

//         type LocalProduct = {
//           id: string;
//           title: string;
//         };
//         `,
//       )

//       const typeAliases = sourceFile.getTypeAliases()
//       collector.addLocalTypes(typeAliases, sourceFile)

//       const dependencies = collector.collectFromImports([])
//       expect(dependencies).toHaveLength(2)

//       const typeNames = dependencies.map((d) => d.typeAlias.getName())
//       expect(typeNames).toContain('LocalUser')
//       expect(typeNames).toContain('LocalProduct')

//       dependencies.forEach((dep) => {
//         expect(dep!.isImported).toBe(false)
//         expect(dep!.sourceFile).toBe(sourceFile)
//       })
//     })

//     test('should not duplicate existing types', () => {
//       const sourceFile = createSourceFile(
//         project,
//         `
//         type User = {
//           id: string;
//           name: string;
//         };
//         `,
//       )

//       const typeAliases = sourceFile.getTypeAliases()
//       collector.addLocalTypes(typeAliases, sourceFile)
//       collector.addLocalTypes(typeAliases, sourceFile)

//       const dependencies = collector.collectFromImports([])
//       expect(dependencies).toHaveLength(1)
//       expect(dependencies[0]!.typeAlias.getName()).toBe('User')
//     })
//   })

//   describe('topological sorting', () => {
//     test('should sort dependencies in correct order', () => {
//       createSourceFile(
//         project,
//         `
//         export type BaseType = {
//           id: string;
//         };
//         `,
//         'base.ts',
//       )

//       createSourceFile(
//         project,
//         `
//         import { BaseType } from "./base";
//         export type User = BaseType & {
//           name: string;
//         };
//         `,
//         'user.ts',
//       )

//       const mainFile = createSourceFile(
//         project,
//         `
//         import { User } from "./user";
//         `,
//         'main.ts',
//       )

//       const importDeclarations = mainFile.getImportDeclarations()
//       const dependencies = collector.collectFromImports(importDeclarations)

//       expect(dependencies).toHaveLength(2)
//       expect(dependencies[0]!.typeAlias.getName()).toBe('BaseType')
//       expect(dependencies[1]!.typeAlias.getName()).toBe('User')
//     })

//     test('should handle complex dependency chains', () => {
//       createSourceFile(
//         project,
//         `
//         export type A = {
//           value: string;
//         };
//         `,
//         'a.ts',
//       )

//       createSourceFile(
//         project,
//         `
//         import { A } from "./a";
//         export type B = {
//           a: A;
//           name: string;
//         };
//         `,
//         'b.ts',
//       )

//       createSourceFile(
//         project,
//         `
//         import { B } from "./b";
//         export type C = {
//           b: B;
//           id: number;
//         };
//         `,
//         'c.ts',
//       )

//       const mainFile = createSourceFile(
//         project,
//         `
//         import { C } from "./c";
//         `,
//         'main.ts',
//       )

//       const importDeclarations = mainFile.getImportDeclarations()
//       const dependencies = collector.collectFromImports(importDeclarations)

//       expect(dependencies).toHaveLength(3)
//       expect(dependencies[0]!.typeAlias.getName()).toBe('A')
//       expect(dependencies[1]!.typeAlias.getName()).toBe('B')
//       expect(dependencies[2]!.typeAlias.getName()).toBe('C')
//     })

//     test('should handle circular dependencies gracefully', () => {
//       createSourceFile(
//         project,
//         `
//         import { B } from "./b";
//         export type A = {
//           b?: B;
//           value: string;
//         };
//         `,
//         'a.ts',
//       )

//       createSourceFile(
//         project,
//         `
//         import { A } from "./a";
//         export type B = {
//           a?: A;
//           name: string;
//         };
//         `,
//         'b.ts',
//       )

//       const mainFile = createSourceFile(
//         project,
//         `
//         import { A } from "./a";
//         import { B } from "./b";
//         `,
//         'main.ts',
//       )

//       const importDeclarations = mainFile.getImportDeclarations()
//       const dependencies = collector.collectFromImports(importDeclarations)

//       expect(dependencies).toHaveLength(2)
//       const typeNames = dependencies.map((d) => d.typeAlias.getName())
//       expect(typeNames).toContain('A')
//       expect(typeNames).toContain('B')
//     })

//     test('should handle types with no dependencies', () => {
//       createSourceFile(
//         project,
//         `
//         export type SimpleType = {
//           id: string;
//           name: string;
//         };
//         `,
//         'simple.ts',
//       )

//       const mainFile = createSourceFile(
//         project,
//         `
//         import { SimpleType } from "./simple";
//         `,
//         'main.ts',
//       )

//       const importDeclarations = mainFile.getImportDeclarations()
//       const dependencies = collector.collectFromImports(importDeclarations)

//       expect(dependencies).toHaveLength(1)
//       expect(dependencies[0]!.typeAlias.getName()).toBe('SimpleType')
//     })
//   })

//   describe('mixed local and imported types', () => {
//     test('should handle both local and imported types correctly', () => {
//       createSourceFile(
//         project,
//         `
//         export type ExternalType = {
//           id: string;
//         };
//         `,
//         'external.ts',
//       )

//       const mainFile = createSourceFile(
//         project,
//         `
//         import { ExternalType } from "./external";

//         type LocalType = {
//           external: ExternalType;
//           local: string;
//         };
//         `,
//         'main.ts',
//       )

//       const importDeclarations = mainFile.getImportDeclarations()
//       const typeAliases = mainFile.getTypeAliases()

//       collector.addLocalTypes(typeAliases, mainFile)
//       const dependencies = collector.collectFromImports(importDeclarations)

//       expect(dependencies).toHaveLength(2)

//       const externalDep = dependencies.find((d) => d.typeAlias.getName() === 'ExternalType')
//       const localDep = dependencies.find((d) => d.typeAlias.getName() === 'LocalType')

//       expect(externalDep!.isImported).toBe(true)
//       expect(localDep!.isImported).toBe(false)

//       expect(dependencies[0]!.typeAlias.getName()).toBe('ExternalType')
//       expect(dependencies[1]!.typeAlias.getName()).toBe('LocalType')
//     })
//   })
// })
