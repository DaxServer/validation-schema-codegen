# TypeBox Code Generation Documentation

- [Overview](#overview)
- [Core Component](#core-component)
  - [Function Flow](#function-flow)
  - [Import Resolution and Dependency Management](#import-resolution-and-dependency-management)
    - [DependencyCollector](#dependencycollector)
    - [Key Features](#key-features)
    - [Implementation Details](#implementation-details)
- [Interface Inheritance Support](#interface-inheritance-support)
  - [Dependency-Ordered Processing](#dependency-ordered-processing)
  - [TypeBox Composite Generation](#typebox-composite-generation)
  - [Implementation Details](#implementation-details-1)
- [Input Handling System](#input-handling-system)
  - [InputOptions Interface](#inputoptions-interface)
  - [Input Processing Features](#input-processing-features)
  - [Usage Patterns](#usage-patterns)
- [Basic Usage](#basic-usage)
  - [With Export Everything](#with-export-everything)
  - [Using File Path](#using-file-path)
- [Utility Functions and Modules](#utility-functions-and-modules)
  - [Handlers Directory](#handlers-directory)
  - [Parsers Directory](#parsers-directory)
  - [Performance Considerations](#performance-considerations)
- [Performance Optimizations](#performance-optimizations)
  - [TypeBox Type Handler Optimization](#typebox-type-handler-optimization)
  - [Parser Instance Reuse](#parser-instance-reuse)
  - [Prettier Optimization](#prettier-optimization)
  - [Import Resolution Performance Optimizations](#import-resolution-performance-optimizations)
    - [ImportParser Optimizations](#importparser-optimizations)
    - [DependencyCollector Optimizations](#dependencycollector-optimizations)
    - [TypeReferenceExtractor Optimizations](#typereferenceextractor-optimizations)
    - [TypeBoxTypeHandlers Optimizations](#typeboxtypehandlers-optimizations)
  - [Performance Testing](#performance-testing)
- [Process Overview](#process-overview)
- [Test-Driven Development](#test-driven-development)
  - [TDD Cycle](#tdd-cycle)
  - [Running Tests](#running-tests)
  - [TDD Workflow for New Features](#tdd-workflow-for-new-features)
  - [Test Organization](#test-organization)
  - [Best Practices](#best-practices)
- [Documentation Guidelines](#documentation-guidelines)

This document describes the process and key components involved in generating TypeBox schemas from TypeScript source files using `ts-morph`.

## Overview

The primary goal of this codebase is to automate the creation of TypeBox schemas and their corresponding static types from existing TypeScript declarations including, but not limited to, `enum`, `type alias`, `interface`, and `function` declarations. This allows for robust runtime validation and type inference based on a single source of truth.

## Core Component

The main logic for code generation resides in the <mcfile name="ts-morph-codegen.ts" path="src/ts-morph-codegen.ts"></mcfile> file. Its primary function, `generateCode`, takes a `GenerateCodeOptions` object as input and returns a string containing the generated TypeBox code. The input can be either a file path or source code string, with support for relative imports when using existing project contexts.

### Function Flow

1.  **Input Processing**: The <mcfile name="input-handler.ts" path="src/input-handler.ts"></mcfile> module processes the input options to create a `SourceFile` object. This supports both file paths and source code strings, with proper validation for relative imports and path resolution.

2.  **Initialization**: A new in-memory `SourceFile` (`output.ts`) is created to build the generated code. Essential imports for TypeBox (`Type`, `Static`) are added as separate import declarations for better compatibility.

3.  **Parser Instantiation**: Instances of `ImportParser`, `EnumParser`, `TypeAliasParser`, and `FunctionDeclarationParser` are created, each responsible for handling specific types of declarations.

4.  **Import Processing**: The `ImportParser` is instantiated and processes all import declarations in the input `sourceFile` to resolve imported types from external files. This includes locating corresponding source files for relative module specifiers and processing type aliases from imported files.

5.  **Enum Processing**: The `EnumParser` is instantiated and iterates through all `enum` declarations in the input `sourceFile`. For each enum, its original declaration is copied, a TypeBox `Type.Enum` schema is generated, and a corresponding static type alias is added.

6.  **Type Alias Processing**: The `TypeAliasParser` is instantiated and iterates through all `type alias` declarations in the input `sourceFile`. For each type alias, its underlying type node is converted into a TypeBox-compatible type representation, a TypeBox schema is generated, and a corresponding static type alias is added.

7.  **Interface Processing**: The `InterfaceParser` is instantiated and iterates through all `interface` declarations in the input `sourceFile`. Interfaces are processed in dependency order to handle inheritance properly. For each interface, its properties and methods are converted into TypeBox object schemas. Interfaces that extend other interfaces are generated using `Type.Intersect` to combine the base interface with additional properties, ensuring proper inheritance semantics.

8.  **Function Declaration Processing**: The `FunctionDeclarationParser` is instantiated and iterates through all function declarations in the input `sourceFile`. For each function, its parameters, optional parameters, and return type are converted into TypeBox function schemas with corresponding static type aliases.

9.  **Output**: Finally, the full text content of the newly generated `output.ts` source file (which now contains all the TypeBox schemas and static types) is returned as a string.

### Import Resolution and Dependency Management

The code generation process includes sophisticated import resolution and dependency management to handle complex type hierarchies and multi-level import chains:

#### DependencyTraversal

The <mcfile name="dependency-traversal.ts" path="src/traverse/dependency-traversal.ts"></mcfile> module implements a unified `DependencyTraversal` class that exclusively uses Graphology for all dependency management:

- **Graphology-Only Architecture**: Uses Graphology's DirectedGraph exclusively for all dependency tracking, eliminating Map-based and other tracking mechanisms
- **Unified Data Management**: All dependency information is stored and managed through the Graphology graph structure with node attributes
- **Topological Sorting**: Employs graphology-dag for robust dependency ordering with circular dependency detection and preference-based sorting
- **Traverses Import Chains**: Recursively follows import declarations to collect all type dependencies from external files
- **Handles Multi-level Imports**: Supports complex scenarios with 3+ levels of nested imports (e.g., `TypeA` imports `TypeB` which imports `TypeC`)
- **Graph-Based Caching**: Uses Graphology node attributes for caching type information and dependency relationships
- **Export-Aware Ordering**: Provides specialized ordering logic for `exportEverything=false` scenarios to ensure proper dependency resolution

#### Key Features

1. **Dependency Order Resolution**: Types are processed in dependency order, ensuring that imported types are defined before types that reference them
2. **Export Keyword Handling**: Imported types are generated without `export` keywords, while local types maintain their original export status
3. **Circular Dependency Detection**: The topological sort algorithm detects and handles circular dependencies gracefully
4. **Type Reference Extraction**: Analyzes TypeScript AST nodes to identify type references and build accurate dependency relationships

#### Implementation Details

The import resolution process works in three phases using the unified architecture:

1. **Collection Phase**:
   - `DependencyTraversal.collectFromImports()` traverses all import declarations using integrated AST traversal
   - `DependencyTraversal.addLocalTypes()` adds local type aliases with unified type reference extraction
   - Dependencies are tracked using Graphology's DirectedGraph with nodes and edges representing type relationships

2. **Analysis Phase**:
   - `DependencyTraversal.getTopologicallySortedTypesWithPreference()` performs dependency ordering with export-aware preferences
   - Uses graphology-dag for circular dependency detection and topological sorting
   - Handles complex dependency scenarios including imported vs. local type ordering based on `exportEverything` flag

3. **Generation Phase**:
   - `DependencyTraversal.getTopologicallySortedTypes()` returns types in dependency order
   - `TypeAliasParser.parseWithImportFlag()` generates code with appropriate export handling
   - Types are processed sequentially in the sorted order

This unified approach ensures robust handling of complex import scenarios, circular dependencies, and generates code that compiles without dependency errors while maintaining optimal performance through reduced module boundaries.

### Unified Dependency Management

The dependency management system is built on a unified architecture that integrates all dependency-related functionality:

#### DependencyTraversal Integration

The <mcfile name="dependency-traversal.ts" path="src/traverse/dependency-traversal.ts"></mcfile> module provides comprehensive dependency management:

- **Integrated AST Traversal**: Combines AST traversal logic with dependency collection for optimal performance
- **Direct Graphology Usage**: Uses Graphology's DirectedGraph directly for dependency tracking without abstraction layers
- **Unified Type Reference Extraction**: Consolidates type reference extraction logic within the main traversal module
- **Export-Aware Processing**: Implements specialized logic for handling `exportEverything=false` scenarios with proper dependency ordering
- **Performance Optimization**: Eliminates module boundaries and reduces function call overhead through unified architecture

#### Graph-Based Dependency Resolution

The unified module leverages Graphology's ecosystem for robust dependency management:

- **DirectedGraph**: Uses Graphology's optimized graph data structure for dependency relationships
- **Topological Sorting**: Employs `topologicalSort` from `graphology-dag` for dependency ordering with circular dependency detection
- **Preference-Based Ordering**: Implements `getTopologicallySortedTypesWithPreference()` for export-aware type ordering
- **Memory Efficiency**: Direct Graphology usage provides optimal memory management for large dependency graphs
- **Type Safety**: Full TypeScript support through graphology-types package

#### Simplified Architecture Benefits

The Graphology-only approach provides several advantages:

- **Simplified Architecture**: Eliminates multiple tracking mechanisms (Map-based dependencies, visitedFiles, various caches) in favor of a single graph-based solution
- **Enhanced Performance**: Direct Graphology operations provide optimized graph algorithms and data structures
- **Improved Maintainability**: Single dependency tracking mechanism reduces complexity and potential inconsistencies
- **Better Memory Management**: Graphology's optimized memory handling for large dependency graphs
- **Unified Data Model**: All dependency information stored consistently in graph nodes and edges

## Interface Inheritance Support

The codebase provides comprehensive support for TypeScript interface inheritance through a sophisticated dependency resolution and code generation system:

### Dependency-Ordered Processing

The main codegen logic in <mcfile name="ts-morph-codegen.ts" path="src/ts-morph-codegen.ts"></mcfile> implements sophisticated processing order management:

1. **Unified Dependency Analysis**: Uses <mcfile name="dependency-traversal.ts" path="src/traverse/dependency-traversal.ts"></mcfile> with integrated graph-based architecture to analyze complex relationships between interfaces and type aliases
2. **Direct Graph Processing**: Leverages Graphology's DirectedGraph and topological sorting for robust dependency ordering without abstraction layers
3. **Export-Aware Processing**: Handles dependency ordering based on `exportEverything` flag:
   - `exportEverything=true`: Prioritizes imported types for consistent ordering
   - `exportEverything=false`: Ensures dependency-aware ordering while respecting local type preferences
4. **Topological Sorting**: Uses `getTopologicallySortedTypesWithPreference()` to ensure types are processed in correct dependency order to prevent "type not found" errors
5. **Circular Dependency Detection**: The graph-based algorithm detects and handles circular inheritance scenarios gracefully with detailed error reporting

### TypeBox Composite Generation

Interface inheritance is implemented using TypeBox's `Type.Composite` functionality:

- **Base Interface Reference**: Extended interfaces reference their base interfaces by name as identifiers
- **Property Combination**: The `InterfaceTypeHandler` generates `Type.Composite([BaseInterface, Type.Object({...})])` for extended interfaces
- **Type Safety**: Generated code maintains full TypeScript type safety through proper static type aliases
- **Generic Type Parameter Handling**: Uses `TSchema` as the constraint for TypeBox compatibility instead of preserving original TypeScript constraints

### Implementation Details

- **Heritage Clause Processing**: The <mcfile name="interface-type-handler.ts" path="src/handlers/typebox/object/interface-type-handler.ts"></mcfile> processes `extends` clauses by extracting referenced type names
- **Identifier Generation**: Base interface references are converted to TypeScript identifiers rather than attempting recursive type resolution
- **TypeBox Constraint Normalization**: Generic type parameters use `TSchema` constraints for TypeBox schema compatibility
- **Error Prevention**: The dependency ordering prevents "No handler found for type" errors that occur when extended interfaces are processed before their base interfaces

## Input Handling System

The <mcfile name="input-handler.ts" path="src/input-handler.ts"></mcfile> module provides flexible input processing capabilities for the code generation system. It supports multiple input methods and handles various edge cases related to file resolution and import validation.

### InputOptions Interface

The `InputOptions` interface defines the available input parameters:

```typescript
export interface InputOptions {
  filePath?: string // Path to TypeScript file
  sourceCode?: string // TypeScript source code as string
  callerFile?: string // Context file path for relative import resolution
  project?: Project // Existing ts-morph Project instance
}
```

### Input Processing Features

1. **Dual Input Support**: Accepts either file paths or source code strings
2. **Path Resolution**: Handles both absolute and relative file paths with proper validation
3. **Relative Import Validation**: Prevents relative imports in string-based source code unless a `callerFile` context is provided
4. **Project Context Sharing**: Supports passing existing `ts-morph` Project instances to maintain import resolution context
5. **Error Handling**: Provides clear error messages for invalid inputs and unresolvable paths

### Usage Patterns

- **File Path Input**: Automatically resolves and loads TypeScript files from disk
- **Source Code Input**: Processes TypeScript code directly from strings with validation
- **Project Context**: Enables proper relative import resolution when working with in-memory source files

## Basic Usage

```typescript
const result = await generateCode({
  sourceCode: sourceFile.getFullText(),
  callerFile: sourceFile.getFilePath(),
})
```

### With Export Everything

```typescript
const result = await generateCode({
  sourceCode: sourceFile.getFullText(),
  exportEverything: true,
  callerFile: sourceFile.getFilePath(),
})
```

### Using File Path

```typescript
const result = await generateCode({
  filePath: './types.ts',
})
```

## Utility Functions and Modules

- <mcfile name="typebox-call.ts" path="src/utils/typebox-call.ts"></mcfile>: Contains the core logic for converting TypeScript type nodes into TypeBox `Type` expressions. `getTypeBoxType` takes a `TypeNode` as input and returns a `ts.Node` representing the equivalent TypeBox schema.
- <mcfile name="add-static-type-alias.ts" path="src/utils/add-static-type-alias.ts"></mcfile>: Generates and adds the `export type [TypeName] = Static<typeof [TypeName]>` declaration to the output source file. This declaration is essential for enabling TypeScript's static type inference from the dynamically generated TypeBox schemas, ensuring type safety at compile time.
- <mcfile name="typebox-codegen-utils.ts" path="src/utils/typebox-codegen-utils.ts"></mcfile>: Contains general utility functions that support the TypeBox code generation process, such as helper functions for string manipulation or AST node creation.
- <mcfile name="key-extraction-utils.ts" path="src/utils/key-extraction-utils.ts"></mcfile>: Provides shared utilities for extracting string literal keys from union or literal types, used by Pick and Omit type handlers to avoid code duplication.
- <mcfile name="node-type-utils.ts" path="src/utils/node-type-utils.ts"></mcfile>: Contains common Node type checking utilities for `canHandle` methods, including functions for checking SyntaxKind, TypeOperator patterns, and TypeReference patterns.

### Handlers Directory

This directory contains a collection of specialized handler modules, each responsible for converting a specific type of TypeScript AST node into its corresponding TypeBox schema. The handlers follow a hierarchical architecture with specialized base classes to reduce code duplication and ensure consistent behavior.

#### Base Handler Classes

- <mcfile name="base-type-handler.ts" path="src/handlers/typebox/base-type-handler.ts"></mcfile>: The root abstract base class that defines the common interface for all type handlers. Provides the `canHandle` and `handle` methods, along with utility functions like `makeTypeCall` for creating TypeBox expressions.
- <mcfile name="type-reference-base-handler.ts" path="src/handlers/typebox/reference/type-reference-base-handler.ts"></mcfile>: Specialized base class for utility type handlers that work with TypeScript type references. Provides `validateTypeReference` and `extractTypeArguments` methods for consistent handling of generic utility types like `Partial<T>`, `Pick<T, K>`, etc.
- <mcfile name="object-like-base-handler.ts" path="src/handlers/typebox/object/object-like-base-handler.ts"></mcfile>: Base class for handlers that process object-like structures (objects and interfaces). Provides `processProperties`, `extractProperties`, and `createObjectType` methods for consistent property handling and TypeBox object creation.
- <mcfile name="collection-base-handler.ts" path="src/handlers/typebox/collection/collection-base-handler.ts"></mcfile>: Base class for handlers that work with collections of types (arrays, tuples, unions, intersections). Provides `processTypeCollection`, `processSingleType`, and `validateNonEmptyCollection` methods for consistent type collection processing.
- <mcfile name="type-operator-base-handler.ts" path="src/handlers/typebox/type-operator-base-handler.ts"></mcfile>: Base class for TypeScript type operator handlers (keyof, readonly). Provides common functionality for checking operator types using `isTypeOperatorWithOperator` utility and processing inner types. Subclasses define `operatorKind`, `typeBoxMethod`, and `createTypeBoxCall` to customize behavior for specific operators.

#### Type Handler Implementations

**Utility Type Handlers** (extend `TypeReferenceBaseHandler`):

- <mcfile name="partial-type-handler.ts" path="src/handlers/typebox/reference/partial-type-handler.ts"></mcfile>: Handles TypeScript `Partial` utility types.
- <mcfile name="pick-type-handler.ts" path="src/handlers/typebox/reference/pick-type-handler.ts"></mcfile>: Handles TypeScript `Pick` utility types.
- <mcfile name="omit-type-handler.ts" path="src/handlers/typebox/reference/omit-type-handler.ts"></mcfile>: Handles TypeScript `Omit` utility types.
- <mcfile name="required-type-handler.ts" path="src/handlers/typebox/reference/required-type-handler.ts"></mcfile>: Handles TypeScript `Required` utility types.
- <mcfile name="record-type-handler.ts" path="src/handlers/typebox/reference/record-type-handler.ts"></mcfile>: Handles TypeScript `Record` utility types.

**Object-Like Type Handlers** (extend `ObjectLikeBaseHandler`):

- <mcfile name="object-type-handler.ts" path="src/handlers/typebox/object/object-type-handler.ts"></mcfile>: Handles TypeScript object types and type literals.
- <mcfile name="interface-type-handler.ts" path="src/handlers/typebox/object/interface-type-handler.ts"></mcfile>: Handles TypeScript interface declarations, including support for interface inheritance using `Type.Composite` to combine base interfaces with extended properties. Supports generic interfaces with type parameters, generating parameterized functions that accept TypeBox schemas as arguments. Handles generic type calls in heritage clauses, converting expressions like `A<number>` to `A(Type.Number())` for proper TypeBox composition.

**Collection Type Handlers** (extend `CollectionBaseHandler`):

- <mcfile name="array-type-handler.ts" path="src/handlers/typebox/collection/array-type-handler.ts"></mcfile>: Handles TypeScript array types (e.g., `string[]`, `Array<number>`).
- <mcfile name="tuple-type-handler.ts" path="src/handlers/typebox/collection/tuple-type-handler.ts"></mcfile>: Handles TypeScript tuple types.
- <mcfile name="union-type-handler.ts" path="src/handlers/typebox/collection/union-type-handler.ts"></mcfile>: Handles TypeScript union types (e.g., `string | number`).
- <mcfile name="intersection-type-handler.ts" path="src/handlers/typebox/collection/intersection-type-handler.ts"></mcfile>: Handles TypeScript intersection types (e.g., `TypeA & TypeB`).

**Type Operator Handlers** (extend `TypeOperatorBaseHandler`):

- <mcfile name="keyof-type-handler.ts" path="src/handlers/typebox/keyof-type-handler.ts"></mcfile>: Handles TypeScript `keyof` type operator for extracting object keys.
- <mcfile name="readonly-type-handler.ts" path="src/handlers/typebox/readonly-type-handler.ts"></mcfile>: Handles TypeScript `readonly` type modifier for creating immutable types.

**Standalone Type Handlers** (extend `BaseTypeHandler`):

- <mcfile name="simple-type-handler.ts" path="src/handlers/typebox/simple-type-handler.ts"></mcfile>: Handles basic TypeScript types like `string`, `number`, `boolean`, `null`, `undefined`, `any`, `unknown`, `void`.
- <mcfile name="literal-type-handler.ts" path="src/handlers/typebox/literal-type-handler.ts"></mcfile>: Handles TypeScript literal types (e.g., `'hello'`, `123`, `true`).
- <mcfile name="function-type-handler.ts" path="src/handlers/typebox/function-type-handler.ts"></mcfile>: Handles TypeScript function types and function declarations, including parameter types, optional parameters, and return types.
- <mcfile name="template-literal-type-handler.ts" path="src/handlers/typebox/template-literal-type-handler.ts"></mcfile>: Handles TypeScript template literal types (e.g., `` `hello-${string}` ``). Parses template literals into components, handling literal text, embedded types (string, number, unions), and string/numeric literals.
- <mcfile name="typeof-type-handler.ts" path="src/handlers/typebox/typeof-type-handler.ts"></mcfile>: Handles TypeScript `typeof` expressions for extracting types from values.
- <mcfile name="type-operator-handler.ts" path="src/handlers/typebox/type-operator-handler.ts"></mcfile>: Fallback handler for other TypeScript type operators not covered by specific handlers.
- <mcfile name="type-reference-handler.ts" path="src/handlers/typebox/type-reference-handler.ts"></mcfile>: Handles references to other types (e.g., `MyType`).
- <mcfile name="indexed-access-type-handler.ts" path="src/handlers/typebox/indexed-access-type-handler.ts"></mcfile>: Handles TypeScript indexed access types (e.g., `Type[Key]`).
- <mcfile name="typebox-type-handler.ts" path="src/handlers/typebox/typebox-type-handler.ts"></mcfile>: A generic handler for TypeBox types.

**Handler Orchestration**:

- <mcfile name="typebox-type-handlers.ts" path="src/handlers/typebox/typebox-type-handlers.ts"></mcfile>: Orchestrates the use of the individual type handlers, acting as a dispatcher based on the type of AST node encountered. Uses optimized lookup mechanisms for performance with O(1) syntax kind-based lookups and type reference name mappings. Includes specialized handlers for type operators (KeyOfTypeHandler, TypeofTypeHandler, ReadonlyTypeHandler) and maintains fallback handlers for edge cases requiring custom logic.

### Parsers Directory

This directory contains a collection of parser classes, each extending the `BaseParser` abstract class. These classes are responsible for parsing specific TypeScript declarations (imports, enums, type aliases) and transforming them into TypeBox schemas and static types. This modular design ensures a clear separation of concerns and facilitates the addition of new parser functionalities.

- <mcfile name="base-parser.ts" path="src/parsers/base-parser.ts"></mcfile>: Defines the abstract `BaseParser` class, providing a common interface and shared properties for all parser implementations.
- <mcfile name="parse-enums.ts" path="src/parsers/parse-enums.ts"></mcfile>: Implements the `EnumParser` class, responsible for processing TypeScript `enum` declarations.
- <mcfile name="parse-imports.ts" path="src/parsers/parse-imports.ts"></mcfile>: Implements the `ImportParser` class, responsible for resolving and processing TypeScript import declarations.
- <mcfile name="parse-type-aliases.ts" path="src/parsers/parse-type-aliases.ts"></mcfile>: Implements the `TypeAliasParser` class, responsible for processing TypeScript `type alias` declarations.
- <mcfile name="parse-function-declarations.ts" path="src/parsers/parse-function-declarations.ts"></mcfile>: Implements the `FunctionDeclarationParser` class, responsible for processing TypeScript function declarations and converting them to TypeBox function schemas.
- <mcfile name="parse-interfaces.ts" path="src/parsers/parse-interfaces.ts"></mcfile>: Implements the `InterfaceParser` class, responsible for processing TypeScript interface declarations with support for inheritance through dependency ordering and `Type.Composite` generation. Handles generic interfaces by generating parameterized functions with type parameters that accept TypeBox schemas as arguments.

### Performance Considerations

When implementing new type handlers or modifying existing ones, it is crucial to consider performance. Operations that involve converting complex TypeScript AST nodes to text, such as `type.getText()`, can be computationally expensive, especially when performed frequently or on large type structures. Directly checking specific properties of AST nodes (e.g., `typeName.getText()`) is significantly more performant than relying on full text representations of types. This principle should be applied throughout the codebase to ensure optimal performance.

## Performance Optimizations

Several optimizations have been implemented to improve the performance of the code generation process, particularly for import resolution and dependency management:

### Unified Dependency Management with Graphology

The project uses **Graphology** through a unified architecture for all dependency graph operations, providing:

- **Production-Ready Graph Library**: Leverages Graphology's battle-tested graph data structures and algorithms
- **Optimized Performance**: Benefits from Graphology's highly optimized internal implementations for graph operations
- **Advanced Graph Algorithms**: Direct access to specialized algorithms through Graphology ecosystem (graphology-dag, graphology-traversal)
- **Type Safety**: Full TypeScript support through graphology-types package
- **Memory Efficiency**: Graphology's optimized memory management for large graphs
- **Unified Architecture**: Single module eliminates abstraction layers and reduces complexity

#### Core Architecture

- **DependencyTraversal**: Uses Graphology's `DirectedGraph` exclusively for all dependency tracking, with no fallback to Map-based structures
- **Integrated Topological Sorting**: Leverages `topologicalSort` from `graphology-dag` for ordering dependencies with export-aware preferences
- **Graph-Based Data Storage**: All dependency information, visited files, and type metadata stored as Graphology node attributes
- **Export-Aware Processing**: Implements specialized ordering logic for different export scenarios using graph-based algorithms

### TypeBox Type Handler Optimization

- **O(1) Handler Lookup**: The `TypeBoxTypeHandlers` class has been optimized from O(n) to O(1) lookup performance using specialized `Map` data structures:
  - **SyntaxKind-based Lookup**: Direct mapping of TypeScript `SyntaxKind` values to handlers for primitive types, arrays, tuples, unions, intersections, and other structural types
  - **Type Reference Name Lookup**: Dedicated mapping for utility types (`Record`, `Partial`, `Pick`, `Omit`, `Required`) based on type reference names
  - **Enhanced TypeReference Handling**: All `TypeReference` nodes that are not specific utility types now default to `TypeReferenceHandler`, significantly reducing reliance on O(n) fallback searches
  - **Minimal Fallback Mechanism**: Maintains backward compatibility with a reduced fallback array for edge cases that require custom `canHandle` logic
- **Handler Caching**: Results are cached based on `typeNode.kind` and `typeNode.getText()` to avoid repeated lookups for identical type nodes
- **Singleton Pattern**: The `getTypeBoxType` function reuses a single `TypeBoxTypeHandlers` instance instead of creating new instances on every call

### Parser Instance Reuse

- **Shared Printer**: A single `ts.createPrinter()` instance is now shared across all parsers (`ImportParser`, `EnumParser`, `TypeAliasParser`) to reduce object creation overhead.
- **TypeAliasParser Caching**: `ImportParser` now reuses a single `TypeAliasParser` instance instead of creating new instances for each import, reducing instantiation overhead.

### Prettier Optimization

- **Configuration Caching**: Prettier options and import strings are now cached as constants to avoid repeated object creation and string concatenation during formatting operations.

### Import Resolution Performance Optimizations

#### ImportParser Optimizations

- **Visited Files Tracking**: Implements `visitedFiles` set to prevent infinite recursion and duplicate processing of the same source files during import chain traversal
- **File Content Caching**: Uses `fileCache` to store parsed import declarations and type aliases, eliminating redundant file parsing operations
- **Reset Mechanism**: Provides `reset()` method to clear internal caches, ensuring memory efficiency between processing sessions

#### DependencyCollector Optimizations

- **Unified File Caching**: Consolidates file data into single cache entries containing both imports and type aliases, reducing memory overhead and cache key complexity
- **Direct Map Operations**: Eliminates intermediate `Map` creation during dependency collection, performing direct operations on the main dependencies map for better performance
- **Early Exit Optimization**: Implements early exit strategies in batch processing loops to avoid unnecessary iterations

#### TypeReferenceExtractor Optimizations

- **Stable Cache Keys**: Uses node text and kind for reliable cache keys that maintain consistency across test runs
- **Set-based Dependency Lookup**: Converts dependency keys to `Set` for O(1) lookup performance instead of O(n) `Map.has()` operations
- **Efficient Node Traversal**: Uses `forEachChild()` instead of `getChildren()` for better AST traversal performance
- **Cache Management**: Provides `clearCache()` method for memory management between processing sessions

#### TypeBoxTypeHandlers Optimizations

- **Stable Cache Keys**: Uses node text and kind for reliable cache keys that maintain consistency across test runs
- **Optimized Handler Lookup**: Prioritizes syntax kind handlers (most common case) before type reference handlers for better average-case performance
- **Cache Management**: Provides public `clearCache()` method for external cache management

These optimizations collectively improve import resolution performance by:

- Reducing redundant file I/O operations through comprehensive caching
- Optimizing data structure access patterns for better algorithmic complexity
- Preventing infinite recursion and duplicate processing scenarios
- Using stable cache keys that maintain consistency across test runs

The optimizations maintain full backward compatibility and test reliability while improving performance for complex import chains and large codebases.

### Performance Testing

To ensure the dependency collection system performs efficiently under various scenarios, comprehensive performance tests have been implemented in <mcfile name="dependency-collector.performance.test.ts" path="tests/dependency-collector.performance.test.ts"></mcfile>. These tests specifically target potential bottlenecks in dependency collection and import processing.

## Process Overview

1.  **Input**: A TypeScript source file containing `enum`, `type alias`, `interface`, and `function` declarations.
2.  **Parsing**: `ts-morph` parses the input TypeScript file into an Abstract Syntax Tree (AST).
3.  **Traversal and Transformation**: The `generateCode` function traverses the AST, identifying and processing various declaration types including enums, type aliases, interfaces, and function declarations.
4.  **TypeBox Schema Generation**: For each identified declaration, the corresponding TypeBox schema is constructed using appropriate `Type` methods (e.g., `Type.Enum`, `Type.Object`, `Type.Function`, etc.). This process involves sophisticated mapping of TypeScript types to their TypeBox equivalents.
5.  **Static Type Generation**: Alongside each TypeBox schema, a TypeScript `type` alias is generated using `Static<typeof ...>` to provide compile-time type safety and seamless integration with existing TypeScript code.
6.  **Output**: A new TypeScript file (as a string) containing the generated TypeBox schemas and static type aliases, ready to be written to disk or integrated into your application.

## Test-Driven Development

This project follows a Test-Driven Development (TDD) methodology to ensure code quality, maintainability, and reliability. The TDD workflow consists of three main phases:

### TDD Cycle

1. **Red Phase**: Write failing tests that define the desired functionality
2. **Green Phase**: Implement the minimal code necessary to make tests pass
3. **Refactor Phase**: Improve code quality while maintaining test coverage

### Running Tests

The project uses Bun as the test runner. Here are the key commands for running tests:

```bash
# Run all tests
bun test

# Run a specific test file
bun test tests/handlers/typebox/function-types.test.ts

# Run tests in a specific directory
bun test tests/
```

### TDD Workflow for New Features

When implementing new type handlers or features:

1. **Start with Tests**: Create test cases in the appropriate test file (e.g., `tests/handlers/typebox/function-types.test.ts` for function-related features)
2. **Run Tests First**: Execute `bun test tests/handlers/typebox/[test-file]` to confirm tests fail as expected
3. **Implement Handler**: Create or modify the type handler to make tests pass
4. **Verify Implementation**: Run tests again to ensure they pass
5. **Integration Testing**: Run the full test suite with `bun test` to ensure no regressions

### Test Organization

Tests are organized into several categories:

- **Unit Tests** (`tests/handlers/`): Test individual type handlers and parsers
- **Performance Tests**: Validate performance characteristics of complex operations

### Best Practices

- Write tests before implementing functionality
- Keep tests focused and atomic
- Use descriptive test names that explain the expected behavior
- Test both positive and negative cases
- Include edge cases and error conditions
- Run specific tests frequently during development
- Run the full test suite before committing changes
- Run any specific tests with path like `bun test tests/handlers/typebox/function-types.test.ts`
- Run any specific test cases using command like `bun test tests/handlers/typebox/function-types.test.ts -t function types`
- If tests keep failing, take help from tsc, lint commands to detect for any issues

## Documentation Guidelines

Whenever changes are made to the codebase, it is crucial to update the relevant sections of this documentation to reflect those changes accurately. This ensures the documentation remains a reliable and up-to-date resource for understanding the project.
