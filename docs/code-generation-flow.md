# Code Generation Flow

Process for transforming TypeScript types to TypeBox schemas.

## Main Pipeline

```typescript
export function generateCode(options: InputOptions): string
```

### Steps

1. **Input Processing** - Create SourceFile from input
2. **Generic Detection** - Check for generic types to determine imports
3. **Output Setup** - Create output file with TypeBox imports
4. **Dependency Analysis** - Use DependencyTraversal to sort types
5. **Code Generation** - Process nodes through TypeBoxPrinter
6. **Output** - Return formatted code

## Input Types

```typescript
interface InputOptions {
  filePath?: string // File path
  sourceCode?: string // Source code string
  callerFile?: string // Context for relative imports
  project?: Project // Existing ts-morph Project
}
```

## Processing Stages

### 1. Input Handling

- File path: Load and parse TypeScript file
- Source code: Process in-memory code with validation
- Project reuse: Share ts-morph Project instances

### 2. Dependency Analysis

Three-tier approach:

- **DependencyTraversal** - Orchestrates analysis
- **FileGraph** - File-level dependencies
- **NodeGraph** - Type-level dependencies and sorting

### 3. Type Conversion

Each type processed through specialized parsers:

- Type aliases → TypeAliasParser
- Interfaces → InterfaceParser
- Enums → EnumParser
- Functions → FunctionDeclarationParser

### 4. Code Generation

For each type:

1. Generate TypeBox schema variable
2. Generate static type alias
3. Handle generic types with arrow functions

## Output Format

```typescript
import { Type, Static } from '@sinclair/typebox'

export const User = Type.Object({
  id: Type.String(),
  name: Type.String(),
})

export type User = Static<typeof User>
```
