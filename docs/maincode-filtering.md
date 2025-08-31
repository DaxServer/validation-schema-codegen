# Maincode Filtering

The code generator automatically filters the output to include only maincode nodes and their connected dependencies. This feature reduces the generated output by excluding imported types that are not actually used by the main code.

## Overview

The code generator includes only the following nodes in the output:

1. **Maincode nodes**: Types defined in the main source file (not imported)
2. **Connected dependencies**: Types that are directly or indirectly referenced by maincode nodes

Imported types that are not referenced anywhere in the dependency chain are automatically filtered out.

## Example

Consider the following file structure:

**external.ts**

```typescript
export type UsedType = {
  value: string
}

export type UnusedType = {
  unused: boolean
}
```

**main.ts**

```typescript
import { UsedType, UnusedType } from './external'

export interface MainInterface {
  data: UsedType // UsedType is referenced and will be included
}

export type SimpleType = {
  id: string
}

// UnusedType is imported but not referenced, so it will be filtered out
```

### Generated Output

```typescript
const result = generateCode({
  filePath: './main.ts',
})
```

**Output automatically excludes unconnected imports:**

```typescript
export const UsedType = Type.Object({
  value: Type.String(),
})

export const MainInterface = Type.Object({
  data: UsedType,
})

export const SimpleType = Type.Object({
  id: Type.String(),
})

// UnusedType is not included because it's not connected to any maincode node
```

## Dependency Chain Handling

The filtering algorithm correctly handles deep dependency chains. If a maincode node references a type that has its own dependencies, all dependencies in the chain are included:

**level1.ts**

```typescript
export type Level1 = {
  value: string
}
```

**level2.ts**

```typescript
import { Level1 } from './level1'
export type Level2 = {
  level1: Level1
}
```

**main.ts**

```typescript
import { Level2 } from './level2'

export interface MainType {
  data: Level2
}
```

The output automatically includes `Level1`, `Level2`, and `MainType` because they form a complete dependency chain starting from the maincode node `MainType`.

## Implementation Details

The filtering algorithm:

1. Identifies maincode nodes (nodes with `isImported: false`) and marks them as required
2. Analyzes type references to identify which imported types are actually used
3. Marks referenced types and their transitive dependencies as required
4. Filters the final output to include only required nodes
5. Returns the filtered nodes in topological order to maintain proper dependency ordering

This approach ensures that only types that are part of a connected dependency graph starting from maincode nodes are included in the output.
