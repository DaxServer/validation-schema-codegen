# Overview

Transforms TypeScript types to TypeBox schemas.

## Supported Types

- Type aliases
- Interfaces (including generic and inheritance)
- Enums
- Functions
- Union/intersection types
- Utility types (Pick, Omit, Partial, Required, Record, Readonly)
- Template literal types
- keyof typeof expressions
- Date type

## Usage

```typescript
import { generateCode } from '@daxserver/validation-schema-codegen'

// From file
const result = generateCode({ filePath: './types.ts' })

// From string
const result = generateCode({
  sourceCode: 'interface User { id: string; }',
  callerFile: './types.ts',
})
```

## Output

```typescript
import { Type, Static } from '@sinclair/typebox'

export const User = Type.Object({
  id: Type.String(),
})

export type User = Static<typeof User>
```

## Documentation

- [architecture.md](./architecture.md) - System architecture
- [parser-system.md](./parser-system.md) - TypeScript parsing
- [handler-system.md](./handler-system.md) - Type conversion
- [compiler-configuration.md](./compiler-configuration.md) - Compiler options and script targets
- [dependency-management.md](./dependency-management.md) - Dependency analysis
- [testing.md](./testing.md) - Testing
