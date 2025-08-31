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

Object property names are extracted using the TypeScript compiler API through `PropertySignature.getNameNode()`. The system handles different property name formats:

- **Identifiers** (`prop`) - extracted using `nameNode.getText()` and preserved as identifiers
- **String literals** (`'prop-name'`, `"prop name"`) - extracted using `nameNode.getLiteralValue()` and validated for identifier compatibility
- **Numeric literals** (`123`) - extracted using `nameNode.getLiteralValue().toString()` and treated as identifiers

The system uses TypeScript's built-in character validation utilities (`ts.isIdentifierStart` and `ts.isIdentifierPart`) with runtime-determined script targets to determine if property names can be safely used as unquoted identifiers in the generated code. The script target is automatically determined from the ts-morph Project's compiler options, ensuring compatibility with the target JavaScript environment while maintaining optimal output format.

### Utility Types

- `PartialTypeHandler` - Partial<T>
- `RequiredTypeHandler` - Required<T>
- `PickTypeHandler` - Pick<T, K>
- `OmitTypeHandler` - Omit<T, K>
- `RecordTypeHandler` - Record<K, V>

### Advanced

- `TemplateLiteralTypeHandler` - `template ${string}`
- `KeyofTypeHandler` - keyof T
- `KeyOfTypeofHandler` - keyof typeof obj
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
