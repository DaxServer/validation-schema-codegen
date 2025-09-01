import type { TraversedNode } from '@daxserver/validation-schema-codegen/traverse/types'
import { resolverStore } from '@daxserver/validation-schema-codegen/utils/resolver-store'
import type { DirectedGraph } from 'graphology'
import Graph from 'graphology'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

export interface VisualizationOptions {
  outputPath?: string
  title?: string
}

export interface GraphNode {
  key: string
  label: string
  x?: number
  y?: number
  size: number
  color: string
  title?: string
}

export interface GraphEdge {
  key: string
  source: string
  target: string
  color?: string
  size?: number
}

/**
 * Converts a graphology DirectedGraph to HTML visualization
 */
export class GraphVisualizer {
  /**
   * Generate HTML visualization for the dependency graph
   */
  static async generateVisualization(
    nodeGraph: DirectedGraph<TraversedNode>,
    options: VisualizationOptions = {},
  ): Promise<string> {
    const { outputPath = './dependency-graph.html', title = 'TypeScript Dependency Graph' } =
      options

    const { nodes, edges } = this.convertGraphToSigmaData(nodeGraph)

    // Always apply ForceAtlas2 layout
    this.applyForceAtlas2Layout(nodes, edges)

    const htmlContent = this.generateHTMLContent(nodes, edges, title)

    const file = Bun.file(outputPath)
    await file.write(htmlContent)

    mkdirSync(dirname(outputPath), { recursive: true })
    writeFileSync(outputPath, htmlContent, 'utf8')

    return outputPath
  }

  /**
   * Convert graphology graph to sigma.js compatible data
   */
  private static convertGraphToSigmaData(graph: DirectedGraph<TraversedNode>): {
    nodes: GraphNode[]
    edges: GraphEdge[]
  } {
    const nodes: GraphNode[] = []
    const edges: GraphEdge[] = []

    // Convert nodes using resolver store to get all qualified names
    const allQualifiedNames = resolverStore.getAllQualifiedNames()
    for (const nodeId of allQualifiedNames) {
      // Only include nodes that exist in the graph
      if (graph.hasNode(nodeId)) {
        const nodeData = graph.getNodeAttributes(nodeId)

        const node: GraphNode = {
          key: nodeId,
          label: `${nodeData.type}: ${nodeData.originalName}`,
          size: this.getNodeSize(nodeData),
          color: this.getEnhancedNodeColor(nodeData),
        }

        nodes.push(node)
      }
    }

    // Convert edges
    for (const edge of graph.edges()) {
      const [source, target] = graph.extremities(edge)

      edges.push({
        key: `${source}-${target}`,
        source: source,
        target: target,
        color: '#848484',
        size: 2,
      })
    }

    return { nodes, edges }
  }

  /**
   * Apply ForceAtlas2 layout to nodes
   */
  private static applyForceAtlas2Layout(nodes: GraphNode[], edges: GraphEdge[]): void {
    // Create a temporary graph for layout calculation
    const tempGraph = new Graph()

    // Add nodes with initial circular positions
    nodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / nodes.length
      const radius = Math.min(300, Math.max(100, nodes.length * 8))
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius

      tempGraph.addNode(node.key, {
        x,
        y,
        size: node.size,
      })
    })

    // Add edges to influence layout
    edges.forEach((e) => {
      if (tempGraph.hasNode(e.source) && tempGraph.hasNode(e.target)) {
        const key = `${e.source}->${e.target}`
        if (!tempGraph.hasEdge(key)) {
          tempGraph.addEdgeWithKey(key, e.source, e.target)
        }
      }
    })

    // Apply ForceAtlas2 layout
    const settings = forceAtlas2.inferSettings(tempGraph)
    const positions = forceAtlas2(tempGraph, {
      iterations: 50,
      settings: {
        ...settings,
        gravity: 1,
        scalingRatio: 10,
      },
    })

    // Update node positions
    nodes.forEach((node) => {
      const position = positions[node.key]
      if (position) {
        node.x = position.x
        node.y = position.y
      }
    })
  }

  /**
   * Get node size based on node type and properties
   */
  private static getNodeSize(nodeData: TraversedNode): number {
    const baseSize = 12

    if (nodeData.isMainCode) {
      return baseSize + 6 // Larger for main code
    }

    switch (nodeData.type) {
      case 'interface':
      case 'typeAlias':
        return baseSize + 4
      case 'enum':
        return baseSize + 3
      case 'function':
        return baseSize + 2
      default:
        return baseSize
    }
  }

  /**
   * Get enhanced node color with intensity based on import nesting level
   */
  private static getEnhancedNodeColor(nodeData: TraversedNode): string {
    const nestingLevel = this.calculateImportNestingLevel(nodeData)
    const intensity = Math.min(1, 0.4 + nestingLevel * 0.15)

    let baseColor: { r: number; g: number; b: number }

    if (nodeData.isMainCode) {
      baseColor = { r: 76, g: 175, b: 80 } // Green
    } else {
      switch (nodeData.type) {
        case 'interface':
          baseColor = { r: 33, g: 150, b: 243 } // Blue
          break
        case 'typeAlias':
          baseColor = { r: 156, g: 39, b: 176 } // Purple
          break
        case 'enum':
          baseColor = { r: 244, g: 67, b: 54 } // Red
          break
        case 'function':
          baseColor = { r: 121, g: 85, b: 72 } // Brown
          break
        default:
          baseColor = { r: 96, g: 125, b: 139 } // Blue Grey
      }
    }

    // Apply intensity
    const r = Math.round(baseColor.r * intensity)
    const g = Math.round(baseColor.g * intensity)
    const b = Math.round(baseColor.b * intensity)

    return `rgb(${r}, ${g}, ${b})`
  }

  /**
   * Calculate import nesting level for color intensity
   */
  private static calculateImportNestingLevel(nodeData: TraversedNode): number {
    if (nodeData.isMainCode) {
      return 4 // Highest intensity for main code
    }

    return 2 // Default level
  }

  /**
   * Generate complete HTML content with sigma.js
   */
  private static generateHTMLContent(
    nodes: GraphNode[],
    edges: GraphEdge[],
    title: string,
  ): string {
    return `<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <script src="https://cdn.jsdelivr.net/npm/graphology@0.26.0/dist/graphology.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sigma@3.0.2/dist/sigma.min.js"></script>

    <style type="text/css">
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        #sigma-container {
            width: 100%;
            height: 80vh;
            border: 1px solid #ccc;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .legend {
            margin-top: 20px;
            padding: 15px;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .legend-item {
            display: inline-block;
            margin: 5px 15px;
            font-size: 14px;
        }
        .legend-color {
            display: inline-block;
            width: 20px;
            height: 20px;
            margin-right: 8px;
            vertical-align: middle;
            border-radius: 3px;
        }

    </style>
</head>
<body>
    <div id="sigma-container"></div>

    <div class="legend">
        <h3>Node Types:</h3>
        <div class="legend-item">
            <span class="legend-color" style="background-color: rgb(33, 150, 243); border-radius: 50%;"></span>
            Interface
        </div>
        <div class="legend-item">
            <span class="legend-color" style="background-color: rgb(156, 39, 176); border-radius: 50%;"></span>
            Type Alias
        </div>
        <div class="legend-item">
            <span class="legend-color" style="background-color: rgb(244, 67, 54); border-radius: 50%;"></span>
            Enum
        </div>
        <div class="legend-item">
            <span class="legend-color" style="background-color: rgb(121, 85, 72); border-radius: 50%;"></span>
            Function
        </div>
        <div class="legend-item">
            <span class="legend-color" style="background-color: rgb(96, 125, 139); border-radius: 50%;"></span>
            Other
        </div>
        <div style="margin-top: 15px;">
            <h4>Color Intensity & Size:</h4>
            <div class="legend-item">
                <span class="legend-color" style="background-color: rgb(76, 175, 80); border-radius: 50%;"></span>
                Main Code (Brightest & Larger)
            </div>
            <div class="legend-item">
                <span class="legend-color" style="background-color: rgba(76, 175, 80, 0.7); border-radius: 50%;"></span>
                Imported (Varies by nesting)
            </div>
        </div>
    </div>

    <script>
        // Wait for all libraries to load
        window.addEventListener('load', function() {
            // Use global variables from UMD builds
            const Graph = window.graphology.Graph;
            const Sigma = window.Sigma;

        // Create a new graph instance
        const graph = new Graph.DirectedGraph();

        // Add nodes to the graph with positioning
        const nodes = ${JSON.stringify(nodes, null, 2)};
        const nodeCount = nodes.length;

        nodes.forEach((node, index) => {
            // Use pre-calculated ForceAtlas2 positions
            const x = node.x || 0;
            const y = node.y || 0;

            graph.addNode(node.key, {
                label: node.label,
                size: node.size,
                color: node.color,
                title: node.title,
                x: x,
                y: y
            });
        });

        // Add edges to the graph
        const edges = ${JSON.stringify(edges, null, 2)};
        edges.forEach(edge => {
            if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
                graph.addEdge(edge.source, edge.target, {
                    color: edge.color,
                    size: edge.size
                });
            }
        });

            // State for hover interactions
            let hoveredNode = null;
            let hoveredNeighbors = new Set();

            // Helper function to convert color to rgba with opacity
            const addOpacity = (color, opacity) => {
                if (color.startsWith('rgb(')) {
                    return color.replace('rgb(', 'rgba(').replace(')', ', ' + opacity + ')');
                } else if (color.startsWith('rgba(')) {
                    // Replace existing alpha value
                    const lastCommaIndex = color.lastIndexOf(',');
                    if (lastCommaIndex !== -1) {
                        return color.substring(0, lastCommaIndex) + ', ' + opacity + ')';
                    }
                    return color;
                } else if (color.startsWith('#')) {
                    // Convert hex to rgba
                    const hex = color.slice(1);
                    const r = parseInt(hex.slice(0, 2), 16);
                    const g = parseInt(hex.slice(2, 4), 16);
                    const b = parseInt(hex.slice(4, 6), 16);
                    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + opacity + ')';
                }
                return color;
            };

            // Node reducer to dim non-hovered nodes
            const nodeReducer = (node, data) => {
                if (hoveredNode && node !== hoveredNode && !hoveredNeighbors.has(node)) {
                    return {
                        ...data,
                        color: addOpacity(data.color, 0.3),
                        size: data.size * 0.7
                    };
                }
                return data;
            };

            // Edge reducer to dim non-hovered edges
            const edgeReducer = (edge, data) => {
                if (hoveredNode && !graph.hasExtremity(edge, hoveredNode)) {
                    return {
                        ...data,
                        color: addOpacity(data.color, 0.3),
                        size: data.size * 0.5
                    };
                }
                return data;
            };

            // Create sigma instance with default circle rendering
            const container = document.getElementById('sigma-container');
            const renderer = new Sigma(graph, container, {
                renderLabels: true,
                renderEdgeLabels: false,
                nodeReducer: nodeReducer,
                edgeReducer: edgeReducer
            });

            // Add hover event listeners
            renderer.on('overNode', (event) => {
                hoveredNode = event.node;
                hoveredNeighbors = new Set(graph.neighbors(event.node));
                renderer.refresh();
            });

            renderer.on('outNode', () => {
                hoveredNode = null;
                hoveredNeighbors.clear();
                renderer.refresh();
            });
        }); // Close the window.addEventListener('load') function
    </script>
</body>
</html>`
  }
}
