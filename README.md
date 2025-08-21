# TypeBox Codegen Fork

This project is a code generation tool designed to automate the creation of TypeBox schemas from existing TypeScript source files. It leverages the `ts-morph` library to parse TypeScript code and extract structural information from various constructs, including:

- **Type Aliases**: Converts TypeScript type aliases into corresponding TypeBox definitions.
- **Enums**: Transforms TypeScript enums into TypeBox enum schemas.
- **Interfaces**: Processes TypeScript interfaces to generate TypeBox object schemas.
- **Function Declarations**: Analyzes function signatures to create TypeBox schemas for their parameters and return types.

The primary goal is to streamline the process of defining data validation and serialization schemas by generating them directly from your TypeScript types, ensuring type safety and consistency across your application.

## Installation

To get started with this project, first ensure you have Bun installed. Then, install the project dependencies by running:

```bash
bun install
```

## Scripts

This project includes several utility scripts to help with development and maintenance:

- `bun run format`: This script uses Prettier to automatically format all code files, ensuring consistent code style across the project.
- `bun run typecheck`: Runs the TypeScript compiler (`tsc`) with the `--noEmit` flag to perform a type check on the entire codebase. This helps catch type-related errors early in the development process.
- `bun run lint`: Executes ESLint to analyze the code for potential errors, stylistic issues, and adherence to best practices. This helps maintain code quality and consistency.
