# Interface Inheritance

Handles TypeScript interface inheritance using TypeBox composites.

## Processing Order

Uses dependency analysis to ensure base interfaces are processed before derived interfaces:

```typescript
interface BaseEntity {
  id: string
}

interface User extends BaseEntity {
  // Processed after BaseEntity
  name: string
}
```

## TypeBox Composite Generation

### Basic Inheritance

```typescript
// TypeScript
interface AdminUser extends BaseUser {
  permissions: string[]
}

// Generated TypeBox
export const AdminUser = Type.Composite([
  BaseUser,
  Type.Object({
    permissions: Type.Array(Type.String()),
  }),
])
```

### Multiple Inheritance

```typescript
// TypeScript
interface Document extends Timestamped, Versioned {
  title: string
}

// Generated TypeBox
export const Document = Type.Composite([
  Timestamped,
  Versioned,
  Type.Object({
    title: Type.String(),
  }),
])
```

## Generic Inheritance

```typescript
// TypeScript
interface ExtendedRepository<T> extends BaseRepository<T> {
  findAll(): Promise<T[]>
}

// Generated TypeBox
export const ExtendedRepository = <T extends TSchema>(T: T) =>
  Type.Composite([
    BaseRepository(T),
    Type.Object({
      findAll: Type.Function([], Type.Promise(Type.Array(T))),
    }),
  ])
```

## Error Prevention

Dependency ordering prevents "type not found" errors by ensuring base interfaces are available when referenced.
