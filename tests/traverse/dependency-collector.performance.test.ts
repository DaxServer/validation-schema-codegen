// import { DependencyCollector } from '@daxserver/validation-schema-codegen/traverse/dependency-collector'
// import { createSourceFile } from '@test-fixtures/utils'
// import { beforeEach, describe, expect, test } from 'bun:test'
// import { Project } from 'ts-morph'

// describe('DependencyCollector Performance Tests', () => {
//   let project: Project
//   let collector: DependencyCollector

//   beforeEach(() => {
//     project = new Project()
//     collector = new DependencyCollector()
//   })

//   describe('large dependency chains', () => {
//     test('should handle deep import chains efficiently', () => {
//       const startTime = performance.now()

//       // Create a chain of 50 files, each importing from the previous
//       for (let i = 0; i < 50; i++) {
//         const content =
//           i === 0
//             ? `export type Type${i} = { id: string; value: number; }`
//             : `import { Type${i - 1} } from "./file${i - 1}";
// export type Type${i} = Type${i - 1} & { field${i}: string; };`

//         createSourceFile(project, content, `file${i}.ts`)
//       }

//       const mainFile = createSourceFile(project, 'import { Type49 } from "./file49";', 'main.ts')

//       const importDeclarations = mainFile.getImportDeclarations()
//       const dependencies = collector.collectFromImports(importDeclarations)

//       const endTime = performance.now()
//       const executionTime = endTime - startTime

//       expect(dependencies).toHaveLength(50)
//       expect(executionTime).toBeLessThan(1000) // Should complete in under 1 second
//     })

//     test('should handle wide import trees efficiently', () => {
//       const startTime = performance.now()

//       // Create 100 independent files
//       for (let i = 0; i < 100; i++) {
//         createSourceFile(
//           project,
//           `export type WideType${i} = { id: string; value${i}: number; }`,
//           `wide${i}.ts`,
//         )
//       }

//       // Create main file that imports all 100 types
//       const imports = Array.from(
//         { length: 100 },
//         (_, i) => `import { WideType${i} } from "./wide${i}";`,
//       ).join('\n')

//       const mainFile = createSourceFile(project, imports, 'main.ts')
//       const importDeclarations = mainFile.getImportDeclarations()
//       const dependencies = collector.collectFromImports(importDeclarations)

//       const endTime = performance.now()
//       const executionTime = endTime - startTime

//       expect(dependencies).toHaveLength(100)
//       expect(executionTime).toBeLessThan(2000) // Should complete in under 2 seconds
//     })
//   })

//   describe('cache efficiency bottlenecks', () => {
//     test('should demonstrate cache key generation overhead', () => {
//       // Create types with complex nested structures that stress the cache key generation
//       const complexType = `
//         export type ComplexType = {
//           nested: {
//             deep: {
//               structure: {
//                 with: {
//                   many: {
//                     levels: {
//                       and: {
//                         properties: string;
//                         numbers: number[];
//                         objects: { [key: string]: any };
//                         unions: string | number | boolean;
//                         intersections: { a: string } & { b: number };
//                         generics: Array<Map<string, Set<number>>>;
//                       };
//                     };
//                   };
//                 };
//               };
//             };
//           };
//         };
//       `

//       const startTime = performance.now()

//       // Create 20 files with the same complex type structure
//       for (let i = 0; i < 20; i++) {
//         createSourceFile(
//           project,
//           complexType.replace('ComplexType', `ComplexType${i}`),
//           `complex${i}.ts`,
//         )
//       }

//       const imports = Array.from(
//         { length: 20 },
//         (_, i) => `import { ComplexType${i} } from "./complex${i}";`,
//       ).join('\n')

//       const mainFile = createSourceFile(project, imports, 'main.ts')
//       const importDeclarations = mainFile.getImportDeclarations()

//       // Process multiple times to stress the cache
//       for (let i = 0; i < 5; i++) {
//         collector.collectFromImports(importDeclarations)
//       }

//       const endTime = performance.now()
//       const executionTime = endTime - startTime

//       expect(executionTime).toBeLessThan(3000) // Should handle repeated processing efficiently
//     })

//     test('should reveal memory usage patterns with large cache', () => {
//       const startTime = performance.now()

//       // Create many files with different but similar type structures
//       for (let i = 0; i < 200; i++) {
//         const typeContent = `
//           export type CacheType${i} = {
//             id: string;
//             data${i}: {
//               field1: string;
//               field2: number;
//               field3: boolean;
//               nested${i}: {
//                 prop1: string[];
//                 prop2: { [key: string]: number };
//                 prop3: Map<string, Set<number>>;
//               };
//             };
//           };
//         `
//         createSourceFile(project, typeContent, `cache${i}.ts`)
//       }

//       const imports = Array.from(
//         { length: 200 },
//         (_, i) => `import { CacheType${i} } from "./cache${i}";`,
//       ).join('\n')

//       const mainFile = createSourceFile(project, imports, 'main.ts')
//       const importDeclarations = mainFile.getImportDeclarations()
//       const dependencies = collector.collectFromImports(importDeclarations)

//       const endTime = performance.now()
//       const executionTime = endTime - startTime

//       expect(dependencies).toHaveLength(200)
//       expect(executionTime).toBeLessThan(5000) // Should handle large cache efficiently
//     })
//   })

//   describe('repeated file processing bottlenecks', () => {
//     test('should reveal inefficiencies in file revisiting', () => {
//       // Create a diamond dependency pattern that causes files to be visited multiple times
//       createSourceFile(project, 'export type BaseType = { id: string; };', 'base.ts')

//       createSourceFile(
//         project,
//         'import { BaseType } from "./base"; export type LeftType = BaseType & { left: string; };',
//         'left.ts',
//       )

//       createSourceFile(
//         project,
//         'import { BaseType } from "./base"; export type RightType = BaseType & { right: number; };',
//         'right.ts',
//       )

//       const startTime = performance.now()

//       // Create multiple files that import both left and right (causing base to be reached multiple ways)
//       for (let i = 0; i < 30; i++) {
//         createSourceFile(
//           project,
//           `
//             import { LeftType } from "./left";
//             import { RightType } from "./right";
//             export type DiamondType${i} = {
//               left: LeftType;
//               right: RightType;
//               unique${i}: string;
//             };
//           `,
//           `diamond${i}.ts`,
//         )
//       }

//       const imports = Array.from(
//         { length: 30 },
//         (_, i) => `import { DiamondType${i} } from "./diamond${i}";`,
//       ).join('\n')

//       const mainFile = createSourceFile(project, imports, 'main.ts')
//       const importDeclarations = mainFile.getImportDeclarations()
//       const dependencies = collector.collectFromImports(importDeclarations)

//       const endTime = performance.now()
//       const executionTime = endTime - startTime

//       expect(dependencies).toHaveLength(33) // base + left + right + 30 diamond types
//       expect(executionTime).toBeLessThan(2000) // Should handle diamond patterns efficiently
//     })

//     test('should demonstrate topological sort performance with complex dependencies', () => {
//       const startTime = performance.now()

//       // Create a complex web of interdependencies
//       for (let i = 0; i < 50; i++) {
//         const dependencies = []
//         // Each type depends on 2-3 previous types (if they exist)
//         for (let j = Math.max(0, i - 3); j < i; j++) {
//           dependencies.push(`TopoType${j}`)
//         }

//         const imports = dependencies
//           .map((dep) => {
//             const fileIndex = parseInt(dep.replace('TopoType', ''))
//             return `import { ${dep} } from "./topo${fileIndex}";`
//           })
//           .join('\n')

//         const typeDefinition =
//           dependencies.length > 0
//             ? `export type TopoType${i} = ${dependencies.join(' & ')} & { field${i}: string; };`
//             : `export type TopoType${i} = { field${i}: string; };`

//         createSourceFile(project, `${imports}\n${typeDefinition}`, `topo${i}.ts`)
//       }

//       const mainFile = createSourceFile(
//         project,
//         'import { TopoType49 } from "./topo49";',
//         'main.ts',
//       )

//       const importDeclarations = mainFile.getImportDeclarations()
//       const dependencies = collector.collectFromImports(importDeclarations)

//       const endTime = performance.now()
//       const executionTime = endTime - startTime

//       expect(dependencies.length).toBeGreaterThan(40) // Should collect most types
//       expect(executionTime).toBeLessThan(3000) // Should handle complex topological sort efficiently
//     })
//   })

//   describe('memory usage patterns', () => {
//     test('should reveal memory inefficiencies with large type definitions', () => {
//       const startTime = performance.now()

//       // Create types with very large string content to stress memory usage
//       for (let i = 0; i < 50; i++) {
//         const largeProperties = Array.from(
//           { length: 100 },
//           (_, j) => `property${i}_${j}: string;`,
//         ).join('\n    ')

//         const typeContent = `
//           export type LargeType${i} = {
//             ${largeProperties}
//           };
//         `
//         createSourceFile(project, typeContent, `large${i}.ts`)
//       }

//       const imports = Array.from(
//         { length: 50 },
//         (_, i) => `import { LargeType${i} } from "./large${i}";`,
//       ).join('\n')

//       const mainFile = createSourceFile(project, imports, 'main.ts')
//       const importDeclarations = mainFile.getImportDeclarations()
//       const dependencies = collector.collectFromImports(importDeclarations)

//       const endTime = performance.now()
//       const executionTime = endTime - startTime

//       expect(dependencies).toHaveLength(50)
//       expect(executionTime).toBeLessThan(4000) // Should handle large type definitions
//     })

//     test('should demonstrate inefficiencies in dependency map operations', () => {
//       const startTime = performance.now()

//       // Create a scenario that stresses Map operations
//       const collector1 = new DependencyCollector()
//       const collector2 = new DependencyCollector()

//       for (let i = 0; i < 100; i++) {
//         createSourceFile(
//           project,
//           `export type MapStressType${i} = { id: string; value${i}: number; };`,
//           `mapstress${i}.ts`,
//         )
//       }

//       const imports = Array.from(
//         { length: 100 },
//         (_, i) => `import { MapStressType${i} } from "./mapstress${i}";`,
//       ).join('\n')

//       const mainFile = createSourceFile(project, imports, 'main.ts')
//       const importDeclarations = mainFile.getImportDeclarations()

//       // Process with multiple collectors to stress Map copying
//       const deps1 = collector1.collectFromImports(importDeclarations)
//       const deps2 = collector2.collectFromImports(importDeclarations)

//       // Access getDependencies multiple times to stress Map copying
//       for (let i = 0; i < 20; i++) {
//         collector1.getDependencies()
//         collector2.getDependencies()
//       }

//       const endTime = performance.now()
//       const executionTime = endTime - startTime

//       expect(deps1).toHaveLength(100)
//       expect(deps2).toHaveLength(100)
//       expect(executionTime).toBeLessThan(3000) // Should handle Map operations efficiently
//     })
//   })
// })
