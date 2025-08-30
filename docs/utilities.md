# Utilities

Helper functions and modules for TypeBox code generation.

## Core Utilities

### TypeBox Conversion

`src/utils/typebox-call.ts` - Main type conversion function:

```typescript
export function getTypeBoxType(node: TypeNode): ts.Node {
  const handlers = new TypeBoxTypeHandlers()
  const handler = handlers.getHandler(node)
  return handler.handle(node)
}
```

### Static Type Generation

`src/utils/add-static-type-alias.ts` - Generates TypeScript type aliases:

```typescript
// Generates: export type User = Static<typeof User>;
addStaticTypeAlias('User', outputFile)
```

### Generic Type Processing

`src/utils/generic-type-utils.ts` - Shared generic utilities:

- `createGenericArrowFunction` - Creates arrow functions for generic types
- `addGenericTypeAlias` - Generates static type aliases for generics

### Key Extraction

`src/utils/key-extraction-utils.ts` - Extracts keys from union/literal types:

```typescript
// For Pick<User, 'id' | 'name'>
extractKeysFromUnionType(keysType) // Returns ['id', 'name']
```

### Node Type Checking

`src/utils/node-type-utils.ts` - Type checking utilities:

```typescript
NodeTypeUtils.isTypeReference(node, 'Partial') // Check if node is Partial<T>
NodeTypeUtils.isReadonlyArrayType(node) // Check if readonly T[]
```

### Template Literal Processing

`src/utils/template-literal-type-processor.ts` - Processes template literal types:

```typescript
// Converts `user-${string}` to Type.TemplateLiteral([...])
```

## Code Generation Helpers

### TypeBox Imports

Creates appropriate imports based on generic type usage:

```typescript
// Basic: import { Type, Static } from '@sinclair/typebox';
// With generics: import { Type, Static, TSchema } from '@sinclair/typebox';
```

### Variable Statements

Creates export variable declarations:

```typescript
// export const User = Type.Object({...});
```
