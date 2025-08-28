# Architecture

## Table of Contents

- [Overview](#overview)
- [Core Components](#core-components)
  - [Code Generation Flow](#code-generation-flow)
  - [TypeBox Printer](#typebox-printer)
  - [Dependency Management](#dependency-management)
  - [Parser System](#parser-system)
  - [Handler System](#handler-system)
  - [Import Resolution](#import-resolution)
  - [Input Handling](#input-handling)
  - [Interface Inheritance](#interface-inheritance)
  - [Utility Functions](#utility-functions)
- [Process Overview](#process-overview)
- [Basic Usage](#basic-usage)
- [Testing](#testing)

## Overview

`@daxserver/validation-schema-codegen` is a comprehensive codegen tool for validation schemas that transforms TypeScript type definitions into TypeBox validation schemas. This project serves as an enhanced alternative to `@sinclair/typebox-codegen`, providing superior type handling capabilities and advanced dependency management through graph-based analysis.

### Supported TypeScript Constructs

- **Type Definitions**: Type aliases, interfaces, enums, and function declarations
- **Generic Types**: Generic interfaces and type parameters with proper constraint handling
- **Complex Types**: Union and intersection types, nested object structures, template literal types
- **Utility Types**: Built-in support for Pick, Omit, Partial, Required, Record, and other TypeScript utility types
- **Advanced Features**: Conditional types, mapped types, keyof operators, indexed access types
- **Import Resolution**: Cross-file type dependencies with qualified naming and circular dependency handling

## Core Components

The main logic for code generation resides in the <mcfile name="index.ts" path="src/index.ts"></mcfile> file. Its primary function, `generateCode`, takes a `GenerateCodeOptions` object as input and returns a string containing the generated TypeBox code. The input can be either a file path or source code string, with support for relative imports when using existing project contexts.

### Code Generation Flow

The `generateCode` function in <mcfile name="index.ts" path="src/index.ts"></mcfile> orchestrates the entire code generation process:

1.  **Input Processing**: Creates a `SourceFile` from input using `createSourceFileFromInput`
2.  **Generic Interface Detection**: Checks for generic interfaces to determine required TypeBox imports
3.  **Output File Creation**: Creates a new output file with necessary `@sinclair/typebox` imports using `createOutputFile`
4.  **Dependency Traversal**: Uses `DependencyTraversal` to analyze and sort all type dependencies
5.  **Code Generation**: Processes sorted nodes using `TypeBoxPrinter` in `printSortedNodes`
6.  **Output Formatting**: Returns the formatted TypeBox schema code

### TypeBox Printer

The <mcfile name="typebox-printer.ts" path="src/printer/typebox-printer.ts"></mcfile> class orchestrates the parsing and printing of TypeScript nodes into TypeBox schemas:

- **Unified Processing**: Handles type aliases, interfaces, enums, and function declarations through a single interface
- **Parser Coordination**: Utilizes dedicated parsers (`TypeAliasParser`, `InterfaceParser`, `EnumParser`, `FunctionDeclarationParser`)
- **Type Tracking**: Maintains a `processedTypes` set to avoid redundant processing
- **Output Management**: Coordinates with the output `SourceFile` and TypeScript printer

### Dependency Management

The system uses a sophisticated graph-based dependency management approach centered around the `DependencyTraversal` class:

#### Architecture Overview

The dependency system consists of three main components:

1. **DependencyTraversal**: <mcfile name="dependency-traversal.ts" path="src/traverse/dependency-traversal.ts"></mcfile> - Main orchestrator
2. **FileGraph**: <mcfile name="file-graph.ts" path="src/traverse/file-graph.ts"></mcfile> - Tracks file-level dependencies
3. **NodeGraph**: <mcfile name="node-graph.ts" path="src/traverse/node-graph.ts"></mcfile> - Manages type-level dependencies

#### Process Flow

1. **Local Type Collection**: Adds all types from the main source file
2. **Import Processing**: Recursively processes import declarations
3. **Dependency Extraction**: Analyzes type references to build dependency graph
4. **Topological Sorting**: Returns nodes in proper dependency order

### Parser System

The parser system is built around a base class architecture in <mcfile name="parsers" path="src/parsers"></mcfile>:

#### Base Parser

The <mcfile name="base-parser.ts" path="src/parsers/base-parser.ts"></mcfile> provides:
- Common interface for all parsers
- Shared access to output `SourceFile`, TypeScript printer, and processed types tracking
- Abstract `parse` method for implementation by specific parsers

#### Specialized Parsers

1. **InterfaceParser**: <mcfile name="parse-interfaces.ts" path="src/parsers/parse-interfaces.ts"></mcfile> - Handles both regular and generic interfaces
2. **TypeAliasParser**: <mcfile name="parse-type-aliases.ts" path="src/parsers/parse-type-aliases.ts"></mcfile> - Processes type alias declarations
3. **EnumParser**: <mcfile name="parse-enums.ts" path="src/parsers/parse-enums.ts"></mcfile> - Handles enum declarations
4. **FunctionParser**: <mcfile name="parse-function-declarations.ts" path="src/parsers/parse-function-declarations.ts"></mcfile> - Processes function declarations
5. **ImportParser**: <mcfile name="parse-imports.ts" path="src/parsers/parse-imports.ts"></mcfile> - Handles import resolution

### Handler System

The handler system in <mcfile name="handlers/typebox" path="src/handlers/typebox"></mcfile> provides TypeBox-specific type conversion through a hierarchical architecture:

#### Handler Categories

1. **Base Handlers**: Foundation classes including <mcfile name="base-type-handler.ts" path="src/handlers/typebox/base-type-handler.ts"></mcfile> and specialized base classes
2. **Collection Handlers**: <mcfile name="array-type-handler.ts" path="src/handlers/typebox/collection/array-type-handler.ts"></mcfile>, <mcfile name="intersection-type-handler.ts" path="src/handlers/typebox/collection/intersection-type-handler.ts"></mcfile>, <mcfile name="tuple-type-handler.ts" path="src/handlers/typebox/collection/tuple-type-handler.ts"></mcfile>, <mcfile name="union-type-handler.ts" path="src/handlers/typebox/collection/union-type-handler.ts"></mcfile>
3. **Object Handlers**: <mcfile name="interface-type-handler.ts" path="src/handlers/typebox/object/interface-type-handler.ts"></mcfile>, <mcfile name="object-type-handler.ts" path="src/handlers/typebox/object/object-type-handler.ts"></mcfile>
4. **Reference Handlers**: <mcfile name="omit-type-handler.ts" path="src/handlers/typebox/reference/omit-type-handler.ts"></mcfile>, <mcfile name="partial-type-handler.ts" path="src/handlers/typebox/reference/partial-type-handler.ts"></mcfile>, <mcfile name="pick-type-handler.ts" path="src/handlers/typebox/reference/pick-type-handler.ts"></mcfile>, <mcfile name="record-type-handler.ts" path="src/handlers/typebox/reference/record-type-handler.ts"></mcfile>, <mcfile name="required-type-handler.ts" path="src/handlers/typebox/reference/required-type-handler.ts"></mcfile>
5. **Simple Handlers**: <mcfile name="simple-type-handler.ts" path="src/handlers/typebox/simple-type-handler.ts"></mcfile>, <mcfile name="literal-type-handler.ts" path="src/handlers/typebox/literal-type-handler.ts"></mcfile>
6. **Advanced Handlers**: <mcfile name="template-literal-type-handler.ts" path="src/handlers/typebox/template-literal-type-handler.ts"></mcfile>, <mcfile name="type-operator-handler.ts" path="src/handlers/typebox/type-operator-handler.ts"></mcfile>, <mcfile name="keyof-type-handler.ts" path="src/handlers/typebox/keyof-type-handler.ts"></mcfile>, <mcfile name="readonly-type-handler.ts" path="src/handlers/typebox/readonly-type-handler.ts"></mcfile>
7. **Function Handlers**: <mcfile name="function-type-handler.ts" path="src/handlers/typebox/function-type-handler.ts"></mcfile>
8. **Type Query Handlers**: <mcfile name="type-query-handler.ts" path="src/handlers/typebox/type-query-handler.ts"></mcfile>, <mcfile name="typeof-type-handler.ts" path="src/handlers/typebox/typeof-type-handler.ts"></mcfile>
9. **Access Handlers**: <mcfile name="indexed-access-type-handler.ts" path="src/handlers/typebox/indexed-access-type-handler.ts"></mcfile>, <mcfile name="type-reference-handler.ts" path="src/handlers/typebox/type-reference-handler.ts"></mcfile>

#### Handler Management

The <mcfile name="typebox-type-handlers.ts" path="src/handlers/typebox/typebox-type-handlers.ts"></mcfile> class orchestrates all handlers through:
- **Handler Caching**: Caches handler instances for performance optimization
- **Fallback System**: Provides fallback handlers for complex cases

### Import Resolution

The import resolution system handles complex import scenarios:

- **Multi-level Imports**: Supports nested import chains of any depth
- **Circular Import Detection**: Prevents infinite loops during traversal
- **Qualified Naming**: Resolves type name collisions across files

### Input Handling

The <mcfile name="input-handler.ts" path="src/input-handler.ts"></mcfile> module provides flexible input processing capabilities for the code generation system. It supports multiple input methods and handles various edge cases related to file resolution and import validation.

#### InputOptions Interface

The `InputOptions` interface defines the available input parameters:

```typescript
export interface InputOptions {
  filePath?: string // Path to TypeScript file
  sourceCode?: string // TypeScript source code as string
  callerFile?: string // Context file path for relative import resolution
  project?: Project // Existing ts-morph Project instance
}
```

#### Input Processing Features

1. **Dual Input Support**: Accepts either file paths or source code strings
2. **Path Resolution**: Handles both absolute and relative file paths with proper validation
3. **Relative Import Validation**: Prevents relative imports in string-based source code unless a `callerFile` context is provided
4. **Project Context Sharing**: Supports passing existing `ts-morph` Project instances to maintain import resolution context
5. **Error Handling**: Provides clear error messages for invalid inputs and unresolvable paths

#### Usage Patterns

- **File Path Input**: Automatically resolves and loads TypeScript files from disk
- **Source Code Input**: Processes TypeScript code directly from strings with validation
- **Project Context**: Enables proper relative import resolution when working with in-memory source files

### Interface Inheritance

The codebase provides comprehensive support for TypeScript interface inheritance through a sophisticated dependency resolution and code generation system:

#### Dependency-Ordered Processing

1. **Separate Graph Analysis**: Uses <mcfile name="dependency-traversal.ts" path="src/traverse/dependency-traversal.ts"></mcfile> with specialized FileGraph and NodeGraph classes to analyze complex relationships between interfaces and type aliases
2. **Specialized Graph Processing**: Leverages NodeGraph's topological sorting for robust type dependency ordering with domain-specific optimizations
3. **Type-Focused Processing**: NodeGraph handles type node dependencies independently from file dependencies for cleaner separation of concerns
4. **Topological Sorting**: Uses `NodeGraph.getNodesToPrint()` to ensure types are processed in correct dependency order to prevent "type not found" errors
5. **Circular Dependency Detection**: The NodeGraph provides built-in circular dependency detection specifically for type relationships with detailed error reporting

#### TypeBox Composite Generation

Interface inheritance is implemented using TypeBox's `Type.Composite` functionality:

- **Base Interface Reference**: Extended interfaces reference their base interfaces by name as identifiers
- **Property Combination**: The `InterfaceTypeHandler` generates `Type.Composite([BaseInterface, Type.Object({...})])` for extended interfaces
- **Type Safety**: Generated code maintains full TypeScript type safety through proper static type aliases
- **Generic Type Parameter Handling**: Uses `TSchema` as the constraint for TypeBox compatibility instead of preserving original TypeScript constraints

#### Implementation Details

- **Heritage Clause Processing**: The <mcfile name="interface-type-handler.ts" path="src/handlers/typebox/object/interface-type-handler.ts"></mcfile> processes `extends` clauses by extracting referenced type names
- **Identifier Generation**: Base interface references are converted to TypeScript identifiers rather than attempting recursive type resolution
- **TypeBox Constraint Normalization**: Generic type parameters use `TSchema` constraints for TypeBox schema compatibility
- **Error Prevention**: The dependency ordering prevents "No handler found for type" errors that occur when extended interfaces are processed before their base interfaces

### Utility Functions

The <mcfile name="utils" path="src/utils"></mcfile> directory provides essential utilities for the TypeBox code generation process:

#### Core Utility Modules

- <mcfile name="typebox-call.ts" path="src/utils/typebox-call.ts"></mcfile>: Contains the core logic for converting TypeScript type nodes into TypeBox `Type` expressions. `getTypeBoxType` takes a `TypeNode` as input and returns a `ts.Node` representing the equivalent TypeBox schema.
- <mcfile name="add-static-type-alias.ts" path="src/utils/add-static-type-alias.ts"></mcfile>: Generates and adds the `export type [TypeName] = Static<typeof [TypeName]>` declaration to the output source file. This declaration is essential for enabling TypeScript's static type inference from the dynamically generated TypeBox schemas, ensuring type safety at compile time.
- <mcfile name="typebox-codegen-utils.ts" path="src/utils/typebox-codegen-utils.ts"></mcfile>: Contains general utility functions that support the TypeBox code generation process, such as helper functions for string manipulation or AST node creation.
- <mcfile name="key-extraction-utils.ts" path="src/utils/key-extraction-utils.ts"></mcfile>: Provides shared utilities for extracting string literal keys from union or literal types, used by Pick and Omit type handlers to avoid code duplication.
- <mcfile name="node-type-utils.ts" path="src/utils/node-type-utils.ts"></mcfile>: Contains common Node type checking utilities for `canHandle` methods, including functions for checking SyntaxKind, TypeOperator patterns, and TypeReference patterns.
- <mcfile name="template-literal-type-processor.ts" path="src/utils/template-literal-type-processor.ts"></mcfile>: Processes literal type nodes within template literals, handling the conversion of embedded literal values into TypeBox expressions for template literal type generation.

#### Template Literal Processing

- **Template Literal Type Processor**: Handles the complex parsing and conversion of TypeScript template literal types into TypeBox `TemplateLiteral` expressions
- **Literal Node Processing**: Converts various literal types (string, number, boolean) within template contexts
- **Pattern Recognition**: Identifies and processes template literal patterns with embedded type expressions

#### Key Extraction System

- **String Key Extraction**: Extracts string literal keys from union types and object type literals for use in utility type handlers
- **TypeBox Expression Generation**: Converts extracted keys into appropriate TypeBox array expressions
- **Shared Utilities**: Provides reusable key extraction logic for Pick, Omit, and other utility type handlers to avoid code duplication

## Process Overview

1.  **Input**: A TypeScript source file containing `enum`, `type alias`, `interface`, and `function` declarations.
2.  **Parsing**: `ts-morph` parses the input TypeScript file into an Abstract Syntax Tree (AST).
3.  **Centralized Dependency Traversal**: The `DependencyTraversal.startTraversal()` method orchestrates the complete dependency collection and ordering process:
   - Collects local types from the main source file
   - Recursively traverses import chains to gather all dependencies
   - Establishes dependency relationships between all types
   - Returns topologically sorted nodes for processing
4.  **Sequential Node Processing**: The sorted nodes are processed sequentially using specialized parsers, ensuring dependencies are handled before dependent types.
5.  **TypeBox Schema Generation**: For each node, the corresponding TypeBox schema is constructed using appropriate `Type` methods (e.g., `Type.Enum`, `Type.Object`, `Type.Function`, etc.). This process involves sophisticated mapping of TypeScript types to their TypeBox equivalents.
6.  **Static Type Generation**: Alongside each TypeBox schema, a TypeScript `type` alias is generated using `Static<typeof ...>` to provide compile-time type safety and seamless integration with existing TypeScript code.
7.  **Output**: A new TypeScript file (as a string) containing the generated TypeBox schemas and static type aliases, ready to be written to disk or integrated into your application.

## Basic Usage

```typescript
const result = await generateCode({
  sourceCode: sourceFile.getFullText(),
  callerFile: sourceFile.getFilePath(),
})
```

### Using File Path

```typescript
const result = await generateCode({
  filePath: './types.ts',
})
```

## Testing

### Test Structure

- **Unit Tests**: Individual component testing using Bun's test framework
- **Integration Tests**: End-to-end testing of the complete generation pipeline
- **Type Safety Tests**: Validation of generated TypeBox schemas
- **Edge Case Coverage**: Testing of complex scenarios and error conditions

### Quality Tools

- **TypeScript Compiler**: Type checking with `bun tsc`
- **ESLint**: Code quality and style enforcement
- **Prettier**: Consistent code formatting
- **Bun Test**: Fast and reliable test execution

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
