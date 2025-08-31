# Dependency Management

Graph-based dependency analysis for proper type processing order with intelligent filtering of unconnected dependencies.

## Components

### DependencyTraversal

Main orchestrator in `src/traverse/dependency-traversal.ts`:

- Coordinates dependency collection
- Filters out unconnected dependencies
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

1. Collect local types from main file (automatically marked as required)
2. Process import chains recursively (adds types to graph)
3. Extract type dependencies (marks referenced types as required)
4. Filter to only connected dependencies
5. Build dependency graph
6. Topological sort for processing order

## Dependency Filtering

The system now filters out unconnected dependencies to optimize output:

- **Local types**: Always included (defined in main file)
- **Imported types**: Only included if actually referenced by other types
- **Transitive dependencies**: Automatically included when their parent types are referenced

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
