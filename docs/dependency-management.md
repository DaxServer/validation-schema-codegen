# Dependency Management

Graph-based dependency analysis for proper type processing order.

## Components

### DependencyTraversal

Main orchestrator in `src/traverse/dependency-traversal.ts`:

- Coordinates dependency collection
- Returns topologically sorted nodes

### FileGraph

Manages file-level dependencies in `src/traverse/file-graph.ts`:

- Tracks import relationships
- Detects circular imports

### NodeGraph

Handles type-level dependencies in `src/traverse/node-graph.ts`:

- Maps type relationships
- Performs topological sorting
- Detects circular type dependencies

## Process

1. Collect local types from main file
2. Process import chains recursively
3. Extract type dependencies
4. Build dependency graph
5. Topological sort for processing order

## Circular Dependencies

### Detection

- File-level: A imports B, B imports A
- Type-level: Type A references Type B, Type B references Type A

### Resolution

- Forward declarations using `Type.Ref()`
- Error reporting with dependency chains

## Visualization

`GraphVisualizer` generates interactive HTML visualizations:

- Sigma.js integration
- Custom node shapes for different types
- Color coding by import depth
- WebGL rendering for performance
