import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";

/**
 * Node types for object relationship diagram
 */
export type NodeType = "Model" | "Repository" | "Service" | "Controller" | "Middleware" | "Other";

/**
 * Node structure for the diagram
 */
export interface DiagramNode {
  id: string;
  name: string;
  type: NodeType;
  filePath: string;
  directory: string;
  methods?: string[];
  properties?: string[];
}

/**
 * Edge structure for the diagram
 */
export interface DiagramEdge {
  source: string;
  target: string;
  relationship: string;
}

/**
 * Object relationship data structure
 */
export interface RelationshipData {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

/**
 * Search criteria for filtering project files
 */
export interface SearchCriteria {
  directory?: string;
  fileName?: string;
  includeAll: boolean;
  includeRelatedNodes?: boolean;
}

/**
 * Cache to store analyzed nodes and relationships to avoid reprocessing
 * This improves performance during searches
 */
const projectCache: {
  nodes: Map<string, DiagramNode>;
  edges: DiagramEdge[];
  initialized: boolean;
} = {
  nodes: new Map<string, DiagramNode>(),
  edges: [],
  initialized: false,
};

/**
 * Get all relationships in the project
 */
export async function getAllRelationships(): Promise<DiagramEdge[]> {
  // Initialize cache if needed
  if (!projectCache.initialized) {
    await initializeProjectCache();
  }

  return projectCache.edges;
}

/**
 * Get a node by its ID
 */
export async function getNodeById(id: string): Promise<DiagramNode | null> {
  // Initialize cache if needed
  if (!projectCache.initialized) {
    await initializeProjectCache();
  }

  return projectCache.nodes.get(id) || null;
}

/**
 * Initialize the project cache with all nodes and relationships
 */
async function initializeProjectCache(): Promise<void> {
  try {
    // Clear existing cache
    projectCache.nodes.clear();
    projectCache.edges = [];

    // Get workspace folders
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return;
    }

    // Use the first workspace folder as the root path
    const rootPath = workspaceFolders[0].uri.fsPath;

    // Find files that might contain ExpressWebJs classes
    const filePattern = "**/*.{ts,js}";
    const excludePattern = "**/{node_modules,dist,build}/**";

    const files = await vscode.workspace.findFiles(filePattern, excludePattern);

    // Process each file
    for (const file of files) {
      try {
        const content = fs.readFileSync(file.fsPath, "utf8");

        // Analyze the file to extract node information
        const node = analyzeFile(file.fsPath, content);

        if (node) {
          // Add to cache
          projectCache.nodes.set(node.id, node);
        }
      } catch (error) {
        console.error(`Error processing file: ${file.fsPath}`, error);
      }
    }

    // Now that we have all nodes, analyze relationships
    // We need to do this after collecting all nodes to ensure proper relationship resolution
    for (const node of projectCache.nodes.values()) {
      try {
        const content = fs.readFileSync(node.filePath, "utf8");

        // Process relationships from this file
        const relationships = analyzeRelationships(node.filePath, content, projectCache.nodes);

        // Add to cache
        projectCache.edges.push(...relationships);
      } catch (error) {
        console.error(`Error processing relationships for: ${node.filePath}`, error);
      }
    }

    // Mark cache as initialized
    projectCache.initialized = true;
  } catch (error) {
    console.error("Error initializing project cache:", error);
    throw error;
  }
}

/**
 * Clear the project cache
 * This should be called when project files change
 */
export function clearProjectCache(): void {
  projectCache.nodes.clear();
  projectCache.edges = [];
  projectCache.initialized = false;
}

/**
 * Analyze project files to find relationships between objects
 */
export async function analyzeProjectRelationships(searchCriteria: SearchCriteria = { includeAll: true }): Promise<RelationshipData> {
  try {
    // Initialize cache if needed
    if (!projectCache.initialized) {
      await initializeProjectCache();
    }

    // If we're showing all, simply return everything from cache
    if (searchCriteria.includeAll) {
      return {
        nodes: Array.from(projectCache.nodes.values()),
        edges: projectCache.edges,
      };
    }

    // Filter nodes based on search criteria
    const matchedNodes: DiagramNode[] = [];
    const nodeIds = new Set<string>();

    for (const node of projectCache.nodes.values()) {
      let matches = true;

      if (searchCriteria.directory) {
        const directoryMatches = node.directory.toLowerCase().includes(searchCriteria.directory.toLowerCase());
        if (!directoryMatches) {
          matches = false;
        }
      }

      if (matches && searchCriteria.fileName) {
        const nameMatches = node.name.toLowerCase().includes(searchCriteria.fileName.toLowerCase());
        if (!nameMatches) {
          matches = false;
        }
      }

      if (matches) {
        matchedNodes.push(node);
        nodeIds.add(node.id);
      }
    }

    // If we don't need related nodes, just return the matches
    if (!searchCriteria.includeRelatedNodes) {
      // Filter edges to only include connections between our matched nodes
      const directEdges = projectCache.edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));

      return {
        nodes: matchedNodes,
        edges: directEdges,
      };
    }

    // Include related nodes
    const relatedNodeIds = new Set<string>(nodeIds);
    const relevantEdges: DiagramEdge[] = [];

    for (const edge of projectCache.edges) {
      // If source is in our matched nodes, include the target
      if (nodeIds.has(edge.source)) {
        relevantEdges.push(edge);
        relatedNodeIds.add(edge.target);
      }
      // If target is in our matched nodes, include the source
      else if (nodeIds.has(edge.target)) {
        relevantEdges.push(edge);
        relatedNodeIds.add(edge.source);
      }
    }

    // Gather all nodes (matched + related)
    const allNodes: DiagramNode[] = [];
    for (const nodeId of relatedNodeIds) {
      const node = projectCache.nodes.get(nodeId);
      if (node) {
        allNodes.push(node);
      }
    }

    return {
      nodes: allNodes,
      edges: relevantEdges,
    };
  } catch (error) {
    console.error("Error analyzing project relationships:", error);
    throw error;
  }
}

/**
 * Find relevant files for analysis based on search criteria
 */
async function findRelevantFiles(rootPath: string, searchCriteria: SearchCriteria): Promise<string[]> {
  // If searching for all files (excluding node_modules, etc.)
  if (searchCriteria.includeAll && !searchCriteria.directory && !searchCriteria.fileName) {
    const allFilesPattern = new vscode.RelativePattern(rootPath, "**/*.{js,ts}");
    const excludePattern = new vscode.RelativePattern(rootPath, "**/node_modules/**");

    const uris = await vscode.workspace.findFiles(allFilesPattern, excludePattern);
    return uris.map((uri) => uri.fsPath);
  }

  // Prepare patterns based on search criteria
  let patterns: string[] = [];

  if (searchCriteria.directory) {
    // If searching by directory
    patterns.push(`**/${searchCriteria.directory}/**/*.{js,ts}`);
  } else {
    // Default patterns - use original patterns for structure detection
    patterns = ["**/Model/**/*.{js,ts}", "**/Repository/**/*.{js,ts}", "**/Service/**/*.{js,ts}", "**/Controller/**/*.{js,ts}", "**/Middleware/**/*.{js,ts}"];
  }

  const files: string[] = [];

  for (const pattern of patterns) {
    const relativePattern = new vscode.RelativePattern(rootPath, pattern);
    const uris = await vscode.workspace.findFiles(relativePattern, "**/node_modules/**");

    for (const uri of uris) {
      // If filename filter is specified, apply it
      if (searchCriteria.fileName) {
        const basename = path.basename(uri.fsPath);
        if (!basename.toLowerCase().includes(searchCriteria.fileName.toLowerCase())) {
          continue;
        }
      }

      files.push(uri.fsPath);
    }
  }

  return files;
}

/**
 * Determine the node type from file path
 */
function getNodeTypeFromFilePath(filePath: string): NodeType {
  const normalizedPath = filePath.toLowerCase();

  if (normalizedPath.includes("/model/") || normalizedPath.includes("\\model\\") || normalizedPath.match(/\w+model\.(js|ts)$/i)) {
    return "Model";
  } else if (normalizedPath.includes("/repository/") || normalizedPath.includes("\\repository\\") || normalizedPath.match(/\w+repository\.(js|ts)$/i)) {
    return "Repository";
  } else if (normalizedPath.includes("/service/") || normalizedPath.includes("\\service\\") || normalizedPath.match(/\w+service\.(js|ts)$/i)) {
    return "Service";
  } else if (normalizedPath.includes("/controller/") || normalizedPath.includes("\\controller\\") || normalizedPath.match(/\w+controller\.(js|ts)$/i)) {
    return "Controller";
  } else if (normalizedPath.includes("/middleware/") || normalizedPath.includes("\\middleware\\") || normalizedPath.match(/\w+middleware\.(js|ts)$/i)) {
    return "Middleware";
  }

  return "Other";
}

/**
 * Analyze a file to determine its node type and properties
 */
function analyzeFile(filePath: string, content: string): DiagramNode | null {
  try {
    const fileName = path.basename(filePath, path.extname(filePath));
    const nodeType = getNodeTypeFromFilePath(filePath);
    const relativePath = vscode.workspace.asRelativePath(filePath);
    const directory = path.dirname(relativePath);

    // Parse the file to extract more information
    const sourceFile = ts.createSourceFile(fileName, content, ts.ScriptTarget.ES2020, true);

    let className = fileName;
    const methods: string[] = [];
    const properties: string[] = [];

    // Visit nodes in AST to find class name, methods and properties
    ts.forEachChild(sourceFile, (node) => {
      if (ts.isClassDeclaration(node) && node.name) {
        className = node.name.text;

        // Get class members
        node.members.forEach((member) => {
          // Get methods
          if (ts.isMethodDeclaration(member) && member.name) {
            const name = member.name.getText(sourceFile);
            if (!name.startsWith("_") && name !== "constructor") {
              methods.push(name);
            }
          }

          // Get properties
          if (ts.isPropertyDeclaration(member) && member.name) {
            const name = member.name.getText(sourceFile);
            if (!name.startsWith("_")) {
              properties.push(name);
            }
          }
        });
      }
    });

    return {
      id: `${nodeType}-${className}`,
      name: className,
      type: nodeType,
      filePath,
      directory,
      methods: methods.length > 0 ? methods : undefined,
      properties: properties.length > 0 ? properties : undefined,
    };
  } catch (error) {
    console.error("Error analyzing file:", filePath, error);
    return null;
  }
}

/**
 * Analyze relationships between nodes
 */
function analyzeRelationships(filePath: string, content: string, nodeMap: Map<string, DiagramNode>): DiagramEdge[] {
  const edges: DiagramEdge[] = [];
  const fileName = path.basename(filePath, path.extname(filePath));
  const sourceNode = Array.from(nodeMap.values()).find((node) => node.filePath === filePath);

  if (!sourceNode) {
    return edges;
  }

  try {
    const sourceFile = ts.createSourceFile(fileName, content, ts.ScriptTarget.ES2020, true);

    // Analysis for constructor dependencies (dependency injection)
    ts.forEachChild(sourceFile, (node) => {
      if (ts.isClassDeclaration(node)) {
        // Look for constructor
        node.members.forEach((member) => {
          if (ts.isConstructorDeclaration(member)) {
            // Look for constructor parameters
            member.parameters.forEach((param) => {
              if (param.type && ts.isTypeReferenceNode(param.type) && param.type.typeName) {
                const typeName = param.type.typeName.getText(sourceFile);

                // Check if this type matches any of our nodes
                Array.from(nodeMap.values()).forEach((targetNode) => {
                  if (targetNode.name === typeName && sourceNode.id !== targetNode.id) {
                    edges.push({
                      source: sourceNode.id,
                      target: targetNode.id,
                      relationship: "depends on",
                    });
                  }
                });
              }
            });
          }
        });
      }
    });

    // Look for imports to identify potential relationships
    const importRegex = /import\s+{[^}]*(?:\b(\w+)\b)[^}]*}\s+from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const importedName = match[1];
      const targetNodes = Array.from(nodeMap.values()).filter((node) => node.name === importedName && node.id !== sourceNode.id);

      targetNodes.forEach((targetNode) => {
        edges.push({
          source: sourceNode.id,
          target: targetNode.id,
          relationship: "imports",
        });
      });
    }

    // Look for inheritance relationships (both extends and implements)
    const classRegex = /class\s+(\w+)\s+extends\s+(\w+)(?:\s+implements\s+([^{]+))?/g;
    while ((match = classRegex.exec(content)) !== null) {
      const childClass = match[1];
      const parentClass = match[2];
      const interfaces = match[3] ? match[3].split(",").map((i) => i.trim()) : [];

      // Handle extends relationship
      if (sourceNode.name === childClass) {
        const targetNodes = Array.from(nodeMap.values()).filter((node) => node.name === parentClass && node.id !== sourceNode.id);

        targetNodes.forEach((targetNode) => {
          edges.push({
            source: sourceNode.id,
            target: targetNode.id,
            relationship: "extends",
          });
        });
      }

      // Handle implements relationship
      if (sourceNode.name === childClass && interfaces.length > 0) {
        interfaces.forEach((interfaceName) => {
          const targetNodes = Array.from(nodeMap.values()).filter((node) => node.name === interfaceName && node.id !== sourceNode.id);

          targetNodes.forEach((targetNode) => {
            edges.push({
              source: sourceNode.id,
              target: targetNode.id,
              relationship: "implements",
            });
          });
        });
      }
    }

    // Look for variable declarations that reference other nodes
    ts.forEachChild(sourceFile, (node) => {
      if (ts.isVariableStatement(node)) {
        node.declarationList.declarations.forEach((declaration) => {
          if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
            if (ts.isNewExpression(declaration.initializer) && declaration.initializer.expression) {
              const className = declaration.initializer.expression.getText(sourceFile);

              // Check if this class name matches any of our nodes
              Array.from(nodeMap.values()).forEach((targetNode) => {
                if (targetNode.name === className && sourceNode.id !== targetNode.id) {
                  edges.push({
                    source: sourceNode.id,
                    target: targetNode.id,
                    relationship: "instantiates",
                  });
                }
              });
            }
          }
        });
      }
    });
  } catch (error) {
    console.error("Error analyzing relationships:", filePath, error);
  }

  return edges;
}
