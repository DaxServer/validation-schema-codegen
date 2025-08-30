# Import Resolution

Handles imports and input processing across multiple files.

## Input Handler

`src/input-handler.ts` processes various input types:

```typescript
interface InputOptions {
  filePath?: string // Path to TypeScript file
  sourceCode?: string // TypeScript source code
  callerFile?: string // Context for relative imports
  project?: Project // Existing ts-morph Project
}
```

## Import Processing

### Multi-level Imports

Supports nested import chains:

```typescript
// File A imports File B
import { UserType } from './user-types'

// File B imports File C
import { BaseEntity } from '../base/entity'
```

### Path Resolution

- Relative imports: `./user`, `../base/entity`
- Absolute imports: `/src/types/user`
- Module imports: `@sinclair/typebox`

### Circular Detection

Uses visited file tracking to prevent infinite loops:

```typescript
if (this.processingStack.has(filePath)) {
  throw new Error(`Circular import detected: ${path}`)
}
```

## Qualified Naming

Resolves type name collisions across files:

```typescript
// user/types.ts exports User
// admin/types.ts exports User
// Generated: User_Types_User, Admin_Types_User
```

## Error Handling

- File not found
- Permission errors
- Invalid import syntax
- Circular dependencies
