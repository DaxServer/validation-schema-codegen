# Testing

Uses Bun test runner with TDD approach.

## Commands

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

## Test Structure

```
tests/
├── handlers/typebox/    # Handler unit tests
├── parsers/            # Parser tests
├── traverse/           # Dependency analysis tests
└── utils/              # Utility tests
```

## TDD Workflow

1. Write failing test
2. Implement minimal code to pass
3. Refactor while keeping tests green
4. Run full test suite before commit

## Test Types

- **Unit tests** - Individual components
- **Integration tests** - End-to-end generation
- **Type safety tests** - Generated schema validation
- **Edge case tests** - Error conditions and complex scenarios
