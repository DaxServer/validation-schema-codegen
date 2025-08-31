# Compiler Configuration

The codegen system automatically adapts to TypeScript compiler options to ensure generated code is compatible with the target JavaScript environment.

## Script Target Detection

The system automatically determines the appropriate TypeScript script target using a two-tier approach:

1. **Project Configuration** - Uses the target specified in the ts-morph Project's compiler options
2. **Environment Detection** - When no explicit target is found, detects the appropriate target based on the runtime TypeScript version

## Identifier Validation

Property names in generated TypeBox objects are validated using TypeScript's built-in utilities:

- `ts.isIdentifierStart()` - validates first character
- `ts.isIdentifierPart()` - validates remaining characters

The validation respects the detected script target to ensure compatibility:

```typescript
// With ES5 target
interface Example {
  validName: string // → validName: Type.String()
  'invalid-name': number // → 'invalid-name': Type.Number()
  '123invalid': boolean // → '123invalid': Type.Boolean()
}
```

## Configuration Management

The `CompilerConfig` singleton manages script target configuration:

- **Singleton Pattern** - Ensures consistent configuration across the application
- **Environment Detection** - Automatically detects appropriate targets from TypeScript version
- **Project Override** - Respects explicit targets from ts-morph Project configuration
- **Runtime Configuration** - Allows manual target specification when needed

## Environment-Based Target Detection

When no explicit target is specified in the project configuration, the system automatically detects an appropriate target based on the TypeScript version:

- **TypeScript 5.2+** → ES2023
- **TypeScript 5.0+** → ES2022
- **TypeScript 4.9+** → ES2022
- **TypeScript 4.7+** → ES2021
- **TypeScript 4.5+** → ES2020
- **TypeScript 4.2+** → ES2019
- **TypeScript 4.1+** → ES2018
- **TypeScript 4.0+** → ES2017
- **TypeScript 3.8+** → ES2017
- **TypeScript 3.6+** → ES2016
- **TypeScript 3.4+** → ES2015
- **Older versions** → ES5

This ensures generated code uses language features that are supported by the available TypeScript compiler, avoiding compatibility issues.

## Integration Points

The configuration system integrates with:

- **Input Handler** - Initializes config when creating source files
- **Code Generation** - Uses config for output file creation
- **Identifier Utils** - Validates property names with correct target
- **Object Handlers** - Determines property name formatting
