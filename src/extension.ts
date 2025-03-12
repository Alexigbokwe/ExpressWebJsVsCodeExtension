import * as vscode from "vscode";
import { registerCommands } from "./commands/index";
import { clearProjectCache } from "./utils/relationshipAnalyzer";
import { RelationshipDiagramProvider } from "./visualizers/relationshipDiagram";
import { ExpressWebJsCommandsProvider } from "./treeViewProvider";

let treeView: vscode.TreeView<any> | undefined;
let commandsProvider: ExpressWebJsCommandsProvider | undefined;

export function activate(context: vscode.ExtensionContext) {
  console.log("ExpresswebJs extension is now active");

  // Register commands - this should register scaffoldController already
  registerCommands(context);

  // Only create the tree view if it doesn't exist
  if (!treeView) {
    // Create the provider and store a reference to it
    commandsProvider = new ExpressWebJsCommandsProvider(context);

    // Create the tree view using the provider
    treeView = vscode.window.createTreeView("expresswebjs-commands", {
      treeDataProvider: commandsProvider,
      showCollapseAll: true,
    });
    context.subscriptions.push(treeView);
  }

  // Register the refresh command for the treeview
  context.subscriptions.push(
    vscode.commands.registerCommand("expresswebjs.refreshTreeView", () => {
      // Use the stored provider reference instead of trying to access it through treeView
      if (commandsProvider) {
        commandsProvider.refresh();
      }
    })
  );

  // Register the package analysis command if needed
  // Make sure it's not already registered in registerCommands
  // context.subscriptions.push(
  //   vscode.commands.registerCommand('expresswebjs.analyzePackages', () => {
  //     // Implementation for package analysis
  //     vscode.window.showInformationMessage('Package Analysis Started');
  //   })
  // );

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
