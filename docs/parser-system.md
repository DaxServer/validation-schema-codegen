# Parser System

Parses TypeScript AST nodes and converts them to TypeBox schemas.

## Base Parser

All parsers extend `BaseParser` in `src/parsers/base-parser.ts`.

## Parsers

- **TypeAliasParser** - `src/parsers/parse-type-aliases.ts`
- **InterfaceParser** - `src/parsers/parse-interfaces.ts`
- **EnumParser** - `src/parsers/parse-enums.ts`
- **FunctionParser** - `src/parsers/parse-function-declarations.ts`
- **ImportParser** - `src/parsers/parse-imports.ts`

## Processing

1. `TypeBoxPrinter` coordinates all parsers
2. Processes nodes in dependency order
3. Each parser handles specific TypeScript constructs
4. Delegates type conversion to handler system

## Generic Types

Both interfaces and type aliases use `GenericTypeUtils.createGenericArrowFunction` for consistent generic processing.
