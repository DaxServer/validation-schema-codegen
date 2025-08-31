# Compiler Configuration

The codegen system automatically adapts to TypeScript compiler options to ensure generated code is compatible with the target JavaScript environment.

## Script Target Detection

The system automatically determines the appropriate TypeScript script target from the ts-morph Project's compiler options

## Identifier Validation

Property names in generated TypeBox objects are validated using TypeScript's built-in utilities:

- `ts.isIdentifierStart()` - validates first character
- `ts.isIdentifierPart()` - validates remaining characters

The validation respects the detected script target to ensure compatibility:

```typescript
// With ES5 target
interface Example {
  validName: string;        // → validName: Type.String()
  "invalid-name": number;   // → "invalid-name": Type.Number()
  "123invalid": boolean;    // → "123invalid": Type.Boolean()
}
```

## Configuration Management

The `CompilerConfig` singleton manages script target configuration.

## Default Behavior

When no explicit target is specified:

- Falls back to `ts.ScriptTarget.Latest`
- Provides maximum compatibility with modern JavaScript features
- Can be overridden per-project as needed

## Integration Points

The configuration system integrates with:

- **Input Handler** - Initializes config when creating source files
- **Code Generation** - Uses config for output file creation
- **Identifier Utils** - Validates property names with correct target
- **Object Handlers** - Determines property name formatting
