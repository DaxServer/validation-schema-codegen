`@daxserver/validation-schema-codegen` transforms TypeScript type definitions into TypeBox validation schemas. It handles complex type relationships and manages dependencies through graph-based analysis.

## Usage

```typescript
import { generateCode } from '@daxserver/validation-schema-codegen'

// Using source code string
const result = generateCode({
  sourceCode: `
    interface User {
      id: string;
      name: string;
      email?: string;
    }
  `,
  callerFile: './src/types.ts',
})

// Using file path
const result = generateCode({
  filePath: './types.ts',
})
```

### Generated Output

```typescript
import { Type, Static } from '@sinclair/typebox'

export const User = Type.Object({
  id: Type.String(),
  name: Type.String(),
  email: Type.Optional(Type.String()),
})

export type User = Static<typeof User>
```

## Development Workflow

### Testing

```bash
# Run all tests
bun test

# Run specific test file
bun test tests/handlers/typebox/function-types.test.ts

# Type checking
bun typecheck

# Linting
bun lint

# Formatting
bun format
```

## Contributing

When contributing to the project:

1. Read the relevant documentation sections for the area you're working on
2. Follow the TDD workflow outlined in [Testing Strategy](./docs/testing.md)
3. Ensure your changes align with the architectural patterns described in the documentation
4. Update documentation as needed for new features or changes
