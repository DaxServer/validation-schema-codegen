# Handler System

Converts TypeScript type nodes to TypeBox expressions.

## Base Handler

```typescript
export abstract class BaseTypeHandler {
  abstract canHandle(node: TypeNode): boolean
  abstract handle(node: TypeNode): ts.Node
}
```

## Handler Categories

### Simple Types

- `SimpleTypeHandler` - string, number, boolean, null, undefined
- `LiteralTypeHandler` - string/number/boolean literals

### Collections

- `ArrayTypeHandler` - T[]
- `TupleTypeHandler` - [T, U]
- `UnionTypeHandler` - T | U
- `IntersectionTypeHandler` - T & U

### Objects

- `ObjectTypeHandler` - { prop: T }
- `InterfaceTypeHandler` - interface references

### Utility Types

- `PartialTypeHandler` - Partial<T>
- `RequiredTypeHandler` - Required<T>
- `PickTypeHandler` - Pick<T, K>
- `OmitTypeHandler` - Omit<T, K>
- `RecordTypeHandler` - Record<K, V>

### Advanced

- `TemplateLiteralTypeHandler` - `template ${string}`
- `KeyofTypeHandler` - keyof T
- `IndexedAccessTypeHandler` - T[K]

## Handler Management

`TypeBoxTypeHandlers` class manages all handlers:

- Caches handler instances
- O(1) lookup for type references
- Fallback system for complex cases

## Registration

Handlers are registered in maps for efficient lookup:

```typescript
this.typeReferenceHandlers.set('Partial', new PartialTypeHandler())
this.typeReferenceHandlers.set('Date', new DateTypeHandler())
```
