"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelationshipDiagramProvider = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const relationshipAnalyzer_1 = require("../utils/relationshipAnalyzer");
/**
 * Class to manage the object relationship diagram visualization
 */
class RelationshipDiagramProvider {
    /**
     * Get the singleton instance of the RelationshipDiagramProvider
     */
    static getInstance(context) {
        if (!RelationshipDiagramProvider.instance) {
            RelationshipDiagramProvider.instance = new RelationshipDiagramProvider(context);
        }
        return RelationshipDiagramProvider.instance;
    }
    constructor(context) {
        this.disposables = [];
        this.lastSearchCriteria = { includeAll: true };
        this.context = context;
    }
    /**
     * Open or create the relationship diagram panel
     */
    async openDiagram() {
        // If we already have a panel, show it
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
            return;
        }
        // Create a new panel
        this.panel = vscode.window.createWebviewPanel(RelationshipDiagramProvider.viewType, "ExpressWebJs Object Relationships", vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, "media"))],
        });
        // Listen for when the panel is disposed
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case "search":
                    await this.searchAndUpdate(message.criteria);
                    break;
                case "refresh":
                    await this.refreshDiagram();
                    break;
                case "export":
                    await this.exportDiagram(message.format, message.data);
                    break;
                case "open-file":
                    await this.openFile(message.filePath);
                    break;
            }
        }, null, this.disposables);
        // Set initial HTML content
        this.panel.webview.html = await this.getWebviewContent();
        // Initial loading of all files
        await this.searchAndUpdate({ includeAll: true });
    }
    /**
     * Search and update the diagram
     */
    async searchAndUpdate(criteria) {
        if (!this.panel) {
            return;
        }
        try {
            // Show loading indicator
            this.panel.webview.postMessage({ command: "updateLoadingStatus", isLoading: true });
            this.lastSearchCriteria = criteria;
            const data = await (0, relationshipAnalyzer_1.analyzeProjectRelationships)(criteria);
            // Update the diagram with found data
            this.panel.webview.postMessage({
                command: "updateDiagram",
                data: data,
                criteria: criteria,
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error analyzing project relationships: ${error}`);
            if (this.panel) {
                this.panel.webview.postMessage({
                    command: "showError",
                    error: String(error),
                });
            }
        }
        finally {
            // Hide loading indicator
            if (this.panel) {
                this.panel.webview.postMessage({ command: "updateLoadingStatus", isLoading: false });
            }
        }
    }
    /**
     * Refresh the relationship diagram with latest data
     */
    async refreshDiagram() {
        if (!this.panel) {
            await this.openDiagram();
            return;
        }
        // Use the last search criteria for refresh
        await this.searchAndUpdate(this.lastSearchCriteria);
    }
    /**
     * Open a file in the editor
     */
    async openFile(filePath) {
        try {
            const document = await vscode.workspace.openTextDocument(filePath);
            await vscode.window.showTextDocument(document);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error opening file: ${error}`);
        }
    }
    /**
     * Export the diagram as SVG or PNG
     */
    async exportDiagram(format, data) {
        try {
            // Show save dialog
            const fileUri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(`expresswebjs-diagram.${format}`),
                filters: {
                    [format === "svg" ? "SVG Files" : "PNG Files"]: [format],
                },
            });
            if (!fileUri) {
                return;
            }
            // For SVG, we can write directly
            if (format === "svg") {
                fs.writeFileSync(fileUri.fsPath, data);
            }
            else {
                // For PNG, data is base64 encoded
                const base64Data = data.replace(/^data:image\/png;base64,/, "");
                fs.writeFileSync(fileUri.fsPath, Buffer.from(base64Data, "base64"));
            }
            vscode.window.showInformationMessage(`Diagram exported as ${format} to: ${fileUri.fsPath}`);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to export diagram: ${error}`);
        }
    }
    /**
     * Get the HTML content for the webview
     */
    async getWebviewContent() {
        // Get webview URIs for resources
        const d3Uri = this.getWebviewUri("d3.min.js");
        const dagreD3Uri = this.getWebviewUri("dagre-d3.min.js");
        const stylesUri = this.getWebviewUri("diagram-styles.css");
        const scriptUri = this.getWebviewUri("diagram.js");
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ExpressWebJs Object Relationships</title>
    <link href="${stylesUri}" rel="stylesheet">
    <script src="${d3Uri}"></script>
    <script src="${dagreD3Uri}"></script>
    <style>
    :root {
      --fleet-bg-color: #121416;
      --fleet-panel-bg: #1e2226;
      --fleet-accent-color: #3d75d9;
      --fleet-text-color: #e6e6e6;
      --fleet-secondary-text: #c5c5c5;
      --fleet-border-color: #2c3033;
      --fleet-shadow: rgba(0, 0, 0, 0.3);
      
      /* Node colors */
      --model-color: #477DC0;
      --repository-color: #D09144;
      --service-color: #7EB36A;
      --controller-color: #C64F4D;
      --middleware-color: #8B67AD;
      --other-color: #7099A6;

      /* Relationship colors */
      --extends-color: #3d75d9;       /* Blue for inheritance */
      --implements-color: #7EB36A;    /* Green for interfaces */
      --depends-on-color: #C64F4D;    /* Red for dependency injection */
      --imports-color: #8B67AD;       /* Purple for imports */
      --instantiates-color: #D09144;  /* Orange for instantiation */
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      margin: 0;
      padding: 0;
      background-color: var(--fleet-bg-color);
      color: var(--fleet-text-color);
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .header {
      background-color: var(--fleet-panel-bg);
      border-bottom: 1px solid var(--fleet-border-color);
      padding: 12px 16px;
    }
    
    .search-container {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }
    
    .search-group {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 200px;
    }
    
    .search-group label {
      margin-right: 8px;
      font-size: 13px;
      color: var(--fleet-secondary-text);
    }
    
    .search-input {
      background-color: var(--fleet-bg-color);
      border: 1px solid var(--fleet-border-color);
      border-radius: 4px;
      color: var(--fleet-text-color);
      padding: 6px 10px;
      font-size: 13px;
      flex: 1;
    }
    
    .search-input:focus {
      outline: none;
      border-color: var(--fleet-accent-color);
    }
    
    .button {
      background-color: var(--fleet-accent-color);
      color: white;
      border: none;
      border-radius: 4px;
      padding: 6px 12px;
      font-size: 13px;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
    
    .button:hover {
      background-color: #4d85e9;
    }
    
    .button.secondary {
      background-color: transparent;
      border: 1px solid var(--fleet-border-color);
      color: var(--fleet-secondary-text);
    }
    
    .button.secondary:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }
    
    .actions {
      display: flex;
      gap: 8px;
    }
    
    .toolbar {
      background-color: var(--fleet-panel-bg);
      padding: 8px 16px;
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid var(--fleet-border-color);
      align-items: center;
    }
    
    .legend {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      font-size: 12px;
      color: var(--fleet-secondary-text);
    }
    
    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 2px;
      margin-right: 4px;
    }
    
    .model-color { background-color: var(--model-color); }
    .repository-color { background-color: var(--repository-color); }
    .service-color { background-color: var(--service-color); }
    .controller-color { background-color: var(--controller-color); }
    .middleware-color { background-color: var(--middleware-color); }
    .other-color { background-color: var(--other-color); }
    
    .diagram-container {
      flex: 1;
      overflow: hidden;
      position: relative;
    }
    
    .loading-overlay {
      position: absolute;
      left: 0;
      top: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(18, 20, 22, 0.7);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10;
    }
    
    .spinner {
      border: 3px solid var(--fleet-border-color);
      border-top: 3px solid var(--fleet-accent-color);
      border-radius: 50%;
      width: 24px;
      height: 24px;
      animation: spin 1s linear infinite;
      margin-bottom: 12px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .error-message {
      background-color: rgba(198, 79, 77, 0.2);
      border: 1px solid #C64F4D;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 12px;
    }
    
    #diagram {
      width: 100%;
      height: 100%;
    }
    
    .node rect {
      stroke: var(--fleet-border-color);
      stroke-width: 1px;
    }
    
    .node text {
      fill: var(--fleet-text-color);
      font-weight: 500;
    }
    
    .edgePath path {
      stroke-width: 1px;
      fill: none;
    }
    
    .edgePath marker {
      fill: var(--fleet-secondary-text);
    }
    
    .extends-path {
      stroke: var(--extends-color);
      stroke-width: 2px;
    }

    .implements-path {
      stroke: var(--implements-color);
      stroke-width: 1.5px;
      stroke-dasharray: 5, 3;
    }

    .depends-on-path {
      stroke: var(--depends-on-color);
      stroke-width: 1.5px;
    }

    .imports-path {
      stroke: var(--imports-color);
      stroke-width: 1px;
      stroke-dasharray: 2, 2;
    }

    .instantiates-path {
      stroke: var(--instantiates-color);
      stroke-width: 1.5px;
    }

    .edgeLabel {
      font-size: 11px;
      font-weight: 500;
      padding: 2px 5px;
      border-radius: 3px;
      background-color: var(--fleet-bg-color);
      box-shadow: 0 0 4px var(--fleet-shadow);
    }

    .extends-label {
      color: var(--extends-color);
    }

    .implements-label {
      color: var(--implements-color);
    }

    .depends-on-label {
      color: var(--depends-on-color);
    }

    .imports-label {
      color: var(--imports-color);
    }

    .instantiates-label {
      color: var(--instantiates-color);
    }
    
    .node .method-list {
      fill: var(--fleet-secondary-text);
      font-size: 11px;
    }
    
    .node-action-icons {
      fill: var(--fleet-text-color);
      cursor: pointer;
    }
    
    .status-bar {
      background-color: var(--fleet-panel-bg);
      border-top: 1px solid var(--fleet-border-color);
      padding: 6px 16px;
      font-size: 12px;
      color: var(--fleet-secondary-text);
      display: flex;
      justify-content: space-between;
    }
    
    .status-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .zoom-controls {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .zoom-button {
      background-color: transparent;
      border: none;
      color: var(--fleet-secondary-text);
      cursor: pointer;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 2px;
    }
    
    .zoom-button:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }
    
    .hidden {
      display: none;
    }

    .visualization-controls {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    .toggle-control {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--fleet-secondary-text);
      font-size: 12px;
      cursor: pointer;
    }

    .toggle-control input[type="checkbox"] {
      margin: 0;
      cursor: pointer;
      width: 14px;
      height: 14px;
      accent-color: var(--fleet-accent-color);
    }

    .relationship-filters {
      display: flex;
      align-items: center;
      gap: 8px;
      border-left: 1px solid var(--fleet-border-color);
      padding-left: 12px;
    }

    .relationship-filters > span {
      color: var(--fleet-secondary-text);
      font-size: 12px;
    }
    </style>
</head>
<body>
    <div class="header">
        <div class="search-container">
            <div class="search-group">
                <label for="directory-search">Directory:</label>
                <input type="text" id="directory-search" class="search-input" placeholder="e.g. src/services">
            </div>
            <div class="search-group">
                <label for="file-search">File Name:</label>
                <input type="text" id="file-search" class="search-input" placeholder="e.g. UserService">
            </div>
            <div class="actions">
                <button id="search-button" class="button">Search</button>
                <button id="reset-search" class="button secondary">Show All</button>
            </div>
            <div class="search-options">
              <label class="toggle-control">
                <input type="checkbox" id="include-related" checked>
                <span>Include related nodes</span>
              </label>
            </div>
        </div>
    </div>
    <div class="toolbar">
      <div class="legend">
        <!-- Node types -->
        <div class="legend-section">
          <div class="legend-item"><div class="legend-color model-color"></div>Model</div>
          <div class="legend-item"><div class="legend-color repository-color"></div>Repository</div>
          <div class="legend-item"><div class="legend-color service-color"></div>Service</div>
          <div class="legend-item"><div class="legend-color controller-color"></div>Controller</div>
          <div class="legend-item"><div class="legend-color middleware-color"></div>Middleware</div>
          <div class="legend-item"><div class="legend-color other-color"></div>Other</div>
        </div>
        
        <!-- Relationship types -->
        <div class="relationship-legend">
          <div class="legend-item">
            <div class="legend-line extends-path"></div>
            <span class="extends-label">Extends</span>
          </div>
          <div class="legend-item">
            <div class="legend-line implements-path"></div>
            <span class="implements-label">Implements</span>
          </div>
          <div class="legend-item">
            <div class="legend-line depends-on-path"></div>
            <span class="depends-on-label">Injection</span>
          </div>
          <div class="legend-item">
            <div class="legend-line imports-path"></div>
            <span class="imports-label">Imports</span>
          </div>
          <div class="legend-item">
            <div class="legend-line instantiates-path"></div>
            <span class="instantiates-label">Instantiates</span>
          </div>
        </div>
      </div>
      
      <!-- Rest of the toolbar content -->
      <div class="visualization-controls">
  <label class="toggle-control">
    <input type="checkbox" id="toggle-methods" checked>
    <span>Show Methods</span>
  </label>
  <label class="toggle-control">
    <input type="checkbox" id="toggle-properties" checked>
    <span>Show Properties</span>
  </label>
  <div class="relationship-filters">
    <span>Relationships:</span>
    <label class="toggle-control">
      <input type="checkbox" name="relationship-type" value="extends" checked>
      <span>Extends</span>
    </label>
    <label class="toggle-control">
      <input type="checkbox" name="relationship-type" value="implements" checked>
      <span>Implements</span>
    </label>
    <label class="toggle-control">
      <input type="checkbox" name="relationship-type" value="depends on" checked>
      <span>Injection</span>
    </label>
    <label class="toggle-control">
      <input type="checkbox" name="relationship-type" value="imports" checked>
      <span>Imports</span>
    </label>
    <label class="toggle-control">
      <input type="checkbox" name="relationship-type" value="instantiates" checked>
      <span>Instantiates</span>
    </label>
  </div>
</div>
<div class="actions">
  <button id="export-svg" class="button secondary">Export SVG</button>
  <button id="export-png" class="button secondary">Export PNG</button>
  <button id="refresh" class="button secondary">Refresh</button>
</div>
    </div>
    <div class="diagram-container">
        <div id="loading-overlay" class="loading-overlay hidden">
            <div class="spinner"></div>
            <div>Analyzing project relationships...</div>
        </div>
        <div id="error-message" class="error-message hidden"></div>
        <svg id="diagram"></svg>
    </div>
    <div class="status-bar">
        <div class="status-item">
            <span id="nodes-count">0 nodes</span>, <span id="edges-count">0 relationships</span>
        </div>
        <div class="zoom-controls">
            <button class="zoom-button" id="zoom-in">+</button>
            <button class="zoom-button" id="zoom-out">-</button>
            <button class="zoom-button" id="zoom-fit">⊕</button>
        </div>
    </div>
    <script src="${scriptUri}"></script>
</body>
</html>`;
    }
    /**
     * Get webview URI for a resource file
     */
    getWebviewUri(filename) {
        const mediaPath = path.join(this.context.extensionPath, "media", filename);
        return this.panel.webview.asWebviewUri(vscode.Uri.file(mediaPath));
    }
    /**
     * Dispose of resources
     */
    dispose() {
        if (this.panel) {
            this.panel.dispose();
            this.panel = undefined;
        }
        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
        RelationshipDiagramProvider.instance = undefined;
    }
}
exports.RelationshipDiagramProvider = RelationshipDiagramProvider;
RelationshipDiagramProvider.viewType = "expresswebjs.objectRelationshipDiagram";
//# sourceMappingURL=relationshipDiagram.js.map