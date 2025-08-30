# Generic Types

Supports generic interfaces and type aliases.

## Processing

Both interfaces and type aliases use `GenericTypeUtils.createGenericArrowFunction` for consistency.

### Type Aliases

```typescript
// TypeScript
type ApiResponse<T> = { data: T; success: boolean }

// Generated TypeBox
export const ApiResponse = <T extends TSchema>(T: T) =>
  Type.Object({
    data: T,
    success: Type.Boolean(),
  })

export type ApiResponse<T> = Static<ReturnType<typeof ApiResponse<T>>>
```

### Interfaces

```typescript
// TypeScript
interface Repository<T> {
  findById(id: string): Promise<T>
}

// Generated TypeBox
export const Repository = <T extends TSchema>(T: T) =>
  Type.Object({
    findById: Type.Function([Type.String()], Type.Promise(T)),
  })
```

## Type Parameters

All type parameters use `TSchema` constraints for TypeBox compatibility:

```typescript
// TypeScript: T extends object
// TypeBox: T extends TSchema
```

## Multiple Parameters

```typescript
type Result<T, E> = { success: true; data: T } | { success: false; error: E }

export const Result = <T extends TSchema, E extends TSchema>(T: T, E: E) =>
  Type.Union([
    Type.Object({ success: Type.Literal(true), data: T }),
    Type.Object({ success: Type.Literal(false), error: E }),
  ])
```
