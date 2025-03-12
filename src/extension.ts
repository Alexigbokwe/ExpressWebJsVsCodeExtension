import * as ts from "typescript";
import * as vscode from "vscode";
import { registerCommands } from "./commands";
import { clearProjectCache } from "./utils/relationshipAnalyzer";
import { RelationshipDiagramProvider } from "./visualizers/relationshipDiagram";
import { ExpressWebJsCommandsProvider } from "./treeViewProvider";

// Store references at module level
let commandsProvider: ExpressWebJsCommandsProvider | undefined;
let treeView: vscode.TreeView<any> | undefined;

export function activate(context: vscode.ExtensionContext) {
  console.log("ExpresswebJs extension is now active");

  // Create the provider first before registering any commands that might use it
  try {
    console.log("Creating TreeView provider");
    commandsProvider = new ExpressWebJsCommandsProvider(context);

    // Register the tree data provider and create the view
    console.log("Registering TreeView provider");
    treeView = vscode.window.createTreeView("expresswebjs-commands", {
      treeDataProvider: commandsProvider,
      showCollapseAll: true,
    });

    context.subscriptions.push(treeView);
    console.log("TreeView provider registered successfully");
  } catch (error) {
    console.error("Error registering TreeView provider:", error);
  }

  // AFTER creating the provider, register the refresh command
  context.subscriptions.push(
    vscode.commands.registerCommand("expresswebjs.refreshTreeView", () => {
      console.log("Refreshing tree view");
      if (commandsProvider) {
        commandsProvider.refresh();
      } else {
        console.error("Cannot refresh tree view: provider not initialized");
      }
    })
  );

  // Register the executeCommand command
  context.subscriptions.push(
    vscode.commands.registerCommand("expresswebjs.executeCommand", (item) => {
      console.log("Executing command for item:", item);
      vscode.window.showInformationMessage(`Command executed: ${item?.label || "Unknown"}`);
    })
  );

  // Register other commands
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
