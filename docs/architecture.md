# Architecture

```
Input → Parser → Dependency Analysis → Handler System → Printer → Output
```

## Components

1. **Input Handler** - Processes file paths or source code strings
2. **Parser System** - Parses TypeScript AST using ts-morph
3. **Dependency Analysis** - Builds dependency graph and sorts types
4. **Handler System** - Converts TypeScript types to TypeBox expressions
5. **Printer** - Generates output code

## Process

1. Parse TypeScript source to AST
2. Extract type declarations
3. Build dependency graph
4. Sort types by dependencies
5. Convert each type to TypeBox expression
6. Generate output code

## Key Files

- `src/index.ts` - Main entry point
- `src/parsers/` - TypeScript AST parsers
- `src/handlers/` - Type conversion handlers
- `src/traverse/` - Dependency analysis
- `src/printer/` - Code generation
