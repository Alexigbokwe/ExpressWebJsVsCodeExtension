import * as vscode from "vscode";
import { registerCommands } from "./commands/index";
import { clearProjectCache } from "./utils/relationshipAnalyzer";
import { RelationshipDiagramProvider } from "./visualizers/relationshipDiagram"; // Add this import

export function activate(context: vscode.ExtensionContext) {
  console.log("ExpresswebJs extension is now active");

  // Register commands
  registerCommands(context);

  // Clear relationship cache when files change
  const fileWatcher = vscode.workspace.createFileSystemWatcher("**/*.{ts,js}");

  // Throttled refresh to avoid too many updates
  let refreshTimer: NodeJS.Timeout | null = null;
  const throttledRefresh = () => {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }
    refreshTimer = setTimeout(() => {
      clearProjectCache();
      // Also refresh diagram if it's currently open
      const diagramProvider = RelationshipDiagramProvider.getInstance(context);
      diagramProvider.refreshDiagram();
      refreshTimer = null;
    }, 2000); // 2 second delay
  };

  fileWatcher.onDidChange(throttledRefresh);
  fileWatcher.onDidCreate(throttledRefresh);
  fileWatcher.onDidDelete(throttledRefresh);

  context.subscriptions.push(fileWatcher);

  vscode.window.showInformationMessage("ExpresswebJs extension is now active!");
}

export function deactivate() {
  console.log("ExpresswebJs extension deactivated");
}
