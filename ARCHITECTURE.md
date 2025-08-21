# TypeBox Code Generation Documentation

- [Overview](#overview)
- [Core Component](#core-component)
  - [Function Flow](#function-flow)
  - [Import Resolution and Dependency Management](#import-resolution-and-dependency-management)
    - [DependencyCollector](#dependencycollector)
    - [Key Features](#key-features)
    - [Implementation Details](#implementation-details)
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
- [Test-Driven Development (TDD) Approach](#test-driven-development-tdd-approach)
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

7.  **Interface Processing**: The `InterfaceParser` is instantiated and iterates through all `interface` declarations in the input `sourceFile`. For each interface, its properties and methods are converted into TypeBox object schemas with corresponding static type aliases.

8.  **Function Declaration Processing**: The `FunctionDeclarationParser` is instantiated and iterates through all function declarations in the input `sourceFile`. For each function, its parameters, optional parameters, and return type are converted into TypeBox function schemas with corresponding static type aliases.

9.  **Output**: Finally, the full text content of the newly generated `output.ts` source file (which now contains all the TypeBox schemas and static types) is returned as a string.

### Import Resolution and Dependency Management

The code generation process includes sophisticated import resolution and dependency management to handle complex type hierarchies and multi-level import chains:

#### DependencyCollector

The <mcfile name="dependency-collector.ts" path="src/utils/dependency-collector.ts"></mcfile> module implements a `DependencyCollector` class that:

- **Traverses Import Chains**: Recursively follows import declarations to collect all type dependencies from external files
- **Builds Dependency Graph**: Creates a comprehensive map of type dependencies, tracking which types depend on which other types
- **Topological Sorting**: Performs topological sorting to ensure types are generated in the correct dependency order
- **Handles Multi-level Imports**: Supports complex scenarios with 3+ levels of nested imports (e.g., `TypeA` imports `TypeB` which imports `TypeC`)

#### Key Features

1. **Dependency Order Resolution**: Types are processed in dependency order, ensuring that imported types are defined before types that reference them
2. **Export Keyword Handling**: Imported types are generated without `export` keywords, while local types maintain their original export status
3. **Circular Dependency Detection**: The topological sort algorithm detects and handles circular dependencies gracefully
4. **Type Reference Extraction**: Analyzes TypeScript AST nodes to identify type references and build accurate dependency relationships

#### Implementation Details

The import resolution process works in two phases:

1. **Collection Phase**:
   - `DependencyCollector.collectFromImports()` traverses all import declarations
   - `DependencyCollector.addLocalTypes()` adds local type aliases
   - Dependencies are tracked in a `Map<string, TypeInfo>` structure

2. **Generation Phase**:
   - `DependencyCollector.getTopologicallySortedTypes()` returns types in dependency order
   - `TypeAliasParser.parseWithImportFlag()` generates code with appropriate export handling
   - Types are processed sequentially in the sorted order

This approach ensures that complex import scenarios work correctly and generated code compiles without dependency errors.

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

- **<mcfile name="typebox-call.ts" path="src/utils/typebox-call.ts"></mcfile>**: This module contains the core logic for converting TypeScript type nodes into TypeBox `Type` expressions. Its primary function, `getTypeBoxType`, takes a TypeScript `TypeNode` as input and returns a `ts.Node` representing the equivalent TypeBox schema. This is a crucial part of the transformation process, handling various TypeScript types like primitives, arrays, objects, and unions.

- **<mcfile name="add-static-type-alias.ts" path="src/utils/add-static-type-alias.ts"></mcfile>**: This utility function is responsible for generating and adding the `export type [TypeName] = Static<typeof [TypeName]>` declaration to the output source file. This declaration is essential for enabling TypeScript's static type inference from the dynamically generated TypeBox schemas, ensuring type safety at compile time.

- **<mcfile name="typebox-codegen-utils.ts" path="src/utils/typebox-codegen-utils.ts"></mcfile>**: This file likely contains general utility functions that support the TypeBox code generation process, such as helper functions for string manipulation or AST node creation.

- **<mcfile name="typescript-ast-parser.ts" path="src/utils/typescript-ast-parser.ts"></mcfile>**: This module is responsible for parsing TypeScript source code and extracting relevant Abstract Syntax Tree (AST) information. It might provide functions to navigate the AST and identify specific nodes like type aliases, interfaces, or enums.

- **<mcfile name="typescript-ast-types.ts" path="src/utils/typescript-ast-types.ts"></mcfile>**: This file likely defines custom types or interfaces that represent the structured AST information extracted by `typescript-ast-parser.ts`, providing a consistent data model for further processing.

### Handlers Directory

This directory contains a collection of specialized handler modules, each responsible for converting a specific type of TypeScript AST node into its corresponding TypeBox schema. This modular approach allows for easy extension and maintenance of the type mapping logic.

- <mcfile name="array-type-handler.ts" path="src/handlers/typebox/array-type-handler.ts"></mcfile>: Handles TypeScript array types (e.g., `string[]`, `Array<number>`).
- <mcfile name="indexed-access-type-handler.ts" path="src/handlers/typebox/indexed-access-type-handler.ts"></mcfile>: Handles TypeScript indexed access types (e.g., `Type[Key]`).
- <mcfile name="intersection-type-handler.ts" path="src/handlers/typebox/intersection-type-handler.ts"></mcfile>: Handles TypeScript intersection types (e.g., `TypeA & TypeB`).
- <mcfile name="literal-type-handler.ts" path="src/handlers/typebox/literal-type-handler.ts"></mcfile>: Handles TypeScript literal types (e.g., `'hello'`, `123`, `true`).
- <mcfile name="object-type-handler.ts" path="src/handlers/typebox/object-type-handler.ts"></mcfile>: Handles TypeScript object types and interfaces.
- <mcfile name="omit-type-handler.ts" path="src/handlers/typebox/omit-type-handler.ts"></mcfile>: Handles TypeScript `Omit` utility types.
- <mcfile name="partial-type-handler.ts" path="src/handlers/typebox/partial-type-handler.ts"></mcfile>: Handles TypeScript `Partial` utility types.
- <mcfile name="pick-type-handler.ts" path="src/handlers/typebox/pick-type-handler.ts"></mcfile>: Handles TypeScript `Pick` utility types.
- <mcfile name="required-type-handler.ts" path="src/handlers/typebox/required-type-handler.ts"></mcfile>: Handles TypeScript `Required` utility types.
- <mcfile name="record-type-handler.ts" path="src/handlers/typebox/record-type-handler.ts"></mcfile>: Handles TypeScript `Record` utility types.
- <mcfile name="simple-type-handler.ts" path="src/handlers/typebox/simple-type-handler.ts"></mcfile>: Handles basic TypeScript types like `string`, `number`, `boolean`, `null`, `undefined`, `any`, `unknown`, `void`.
- <mcfile name="function-type-handler.ts" path="src/handlers/typebox/function-type-handler.ts"></mcfile>: Handles TypeScript function types and function declarations, including parameter types, optional parameters, and return types.
- <mcfile name="template-literal-type-handler.ts" path="src/handlers/typebox/template-literal-type-handler.ts"></mcfile>: Handles TypeScript template literal types (e.g., `` `hello-${string}` ``).
- <mcfile name="typeof-type-handler.ts" path="src/handlers/typebox/typeof-type-handler.ts"></mcfile>: Handles TypeScript `typeof` expressions for extracting types from values.
- <mcfile name="tuple-type-handler.ts" path="src/handlers/typebox/tuple-type-handler.ts"></mcfile>: Handles TypeScript tuple types.
- <mcfile name="type-operator-handler.ts" path="src/handlers/typebox/type-operator-handler.ts"></mcfile>: Handles TypeScript type operators like `keyof`, `typeof`.
- <mcfile name="type-reference-handler.ts" path="src/handlers/typebox/type-reference-handler.ts"></mcfile>: Handles references to other types (e.g., `MyType`).
- <mcfile name="typebox-type-handler.ts" path="src/handlers/typebox/typebox-type-handler.ts"></mcfile>: A generic handler for TypeBox types.
- <mcfile name="typebox-type-handlers.ts" path="src/handlers/typebox/typebox-type-handlers.ts"></mcfile>: This file likely orchestrates the use of the individual type handlers, acting as a dispatcher based on the type of AST node encountered.
- <mcfile name="union-type-handler.ts" path="src/handlers/typebox/union-type-handler.ts"></mcfile>: Handles TypeScript union types (e.g., `string | number`).

### Parsers Directory

This directory contains a collection of parser classes, each extending the `BaseParser` abstract class. These classes are responsible for parsing specific TypeScript declarations (imports, enums, type aliases) and transforming them into TypeBox schemas and static types. This modular design ensures a clear separation of concerns and facilitates the addition of new parser functionalities.

- <mcfile name="base-parser.ts" path="src/parsers/base-parser.ts"></mcfile>: Defines the abstract `BaseParser` class, providing a common interface and shared properties for all parser implementations.
- <mcfile name="parse-enums.ts" path="src/parsers/parse-enums.ts"></mcfile>: Implements the `EnumParser` class, responsible for processing TypeScript `enum` declarations.
- <mcfile name="parse-imports.ts" path="src/parsers/parse-imports.ts"></mcfile>: Implements the `ImportParser` class, responsible for resolving and processing TypeScript import declarations.
- <mcfile name="parse-type-aliases.ts" path="src/parsers/parse-type-aliases.ts"></mcfile>: Implements the `TypeAliasParser` class, responsible for processing TypeScript `type alias` declarations.
- <mcfile name="parse-function-declarations.ts" path="src/parsers/parse-function-declarations.ts"></mcfile>: Implements the `FunctionDeclarationParser` class, responsible for processing TypeScript function declarations and converting them to TypeBox function schemas.

### Performance Considerations

When implementing new type handlers or modifying existing ones, it is crucial to consider performance. Operations that involve converting complex TypeScript AST nodes to text, such as `type.getText()`, can be computationally expensive, especially when performed frequently or on large type structures. Directly checking specific properties of AST nodes (e.g., `typeName.getText()`) is significantly more performant than relying on full text representations of types. This principle should be applied throughout the codebase to ensure optimal performance.

## Performance Optimizations

Several optimizations have been implemented to improve the performance of the code generation process, particularly for import resolution:

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

To ensure the dependency collection system performs efficiently under various scenarios, comprehensive performance tests have been implemented in <mcfile name="dependency-collector.performance.test.ts" path="tests/ts-morph/dependency-collector.performance.test.ts"></mcfile>. These tests specifically target potential bottlenecks in dependency collection and import processing.

## Process Overview

1.  **Input**: A TypeScript source file containing `enum`, `type alias`, `interface`, and `function` declarations.
2.  **Parsing**: `ts-morph` parses the input TypeScript file into an Abstract Syntax Tree (AST).
3.  **Traversal and Transformation**: The `generateCode` function traverses the AST, identifying and processing various declaration types including enums, type aliases, interfaces, and function declarations.
4.  **TypeBox Schema Generation**: For each identified declaration, the corresponding TypeBox schema is constructed using appropriate `Type` methods (e.g., `Type.Enum`, `Type.Object`, `Type.Function`, etc.). This process involves sophisticated mapping of TypeScript types to their TypeBox equivalents.
5.  **Static Type Generation**: Alongside each TypeBox schema, a TypeScript `type` alias is generated using `Static<typeof ...>` to provide compile-time type safety and seamless integration with existing TypeScript code.
6.  **Output**: A new TypeScript file (as a string) containing the generated TypeBox schemas and static type aliases, ready to be written to disk or integrated into your application.

## Test-Driven Development (TDD) Approach

This project follows a Test-Driven Development methodology to ensure code quality, maintainability, and reliability. The TDD workflow consists of three main phases:

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
bun test tests/ts-morph/function-types.test.ts

# Run tests in a specific directory
bun test tests/ts-morph/
```

### TDD Workflow for New Features

When implementing new type handlers or features:

1. **Start with Tests**: Create test cases in the appropriate test file (e.g., `tests/ts-morph/function-types.test.ts` for function-related features)
2. **Run Tests First**: Execute `bun test tests/ts-morph/[test-file]` to confirm tests fail as expected
3. **Implement Handler**: Create or modify the type handler to make tests pass
4. **Verify Implementation**: Run tests again to ensure they pass
5. **Integration Testing**: Run the full test suite with `bun test` to ensure no regressions
6. **Manual Verification**: Test with integration examples like `tests/integration/wikibase/wikibase.ts`

### Test Organization

Tests are organized into several categories:

- **Unit Tests** (`tests/ts-morph/`): Test individual type handlers and parsers
- **Integration Tests** (`tests/integration/`): Test end-to-end functionality with real-world examples
- **Performance Tests**: Validate performance characteristics of complex operations

### Best Practices

- Write tests before implementing functionality
- Keep tests focused and atomic
- Use descriptive test names that explain the expected behavior
- Test both positive and negative cases
- Include edge cases and error conditions
- Run specific tests frequently during development
- Run the full test suite before committing changes
- Run any specific tests with path like `bun test tests/ts-morph/function-types.test.ts`
- Run any specific test cases using command like `bun test tests/ts-morph/function-types.test.ts -t function types`
- If tests keep failing, take help from tsc, lint commands to detect for any issues

## Documentation Guidelines

Whenever changes are made to the codebase, it is crucial to update the relevant sections of this documentation to reflect those changes accurately. This ensures the documentation remains a reliable and up-to-date resource for understanding the project.
