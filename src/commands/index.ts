import * as vscode from "vscode";
import { scaffoldController, scaffoldRoute, scaffoldMiddleware, scaffoldServiceProvider, scaffoldJob, scaffoldCommand, scaffoldValidation } from "./scaffolding";
import { RelationshipDiagramProvider } from "../visualizers/relationshipDiagram";

// Register all commands in one place
export function registerCommands(context: vscode.ExtensionContext) {
  // Register existing command
  const infoCommand = vscode.commands.registerCommand("expresswebjs.someCommand", () => {
    vscode.window.showInformationMessage("ExpresswebJs command executed!");
  });

  // Register all commands here
  context.subscriptions.push(
    infoCommand,
    vscode.commands.registerCommand("expresswebjs.scaffoldController", scaffoldController),
    vscode.commands.registerCommand("expresswebjs.scaffoldRoute", scaffoldRoute),
    vscode.commands.registerCommand("expresswebjs.scaffoldMiddleware", scaffoldMiddleware),
    vscode.commands.registerCommand("expresswebjs.scaffoldServiceProvider", scaffoldServiceProvider),
    vscode.commands.registerCommand("expresswebjs.scaffoldJob", scaffoldJob),
    vscode.commands.registerCommand("expresswebjs.scaffoldCommand", scaffoldCommand),
    vscode.commands.registerCommand("expresswebjs.scaffoldValidation", scaffoldValidation),
    vscode.commands.registerCommand("expresswebjs.showRelationshipDiagram", async () => {
      try {
        const diagramProvider = RelationshipDiagramProvider.getInstance(context);
        await diagramProvider.openDiagram();
      } catch (error) {
        vscode.window.showErrorMessage(`Error showing relationship diagram: ${error}`);
      }
    }),
    vscode.commands.registerCommand("expresswebjs.refreshRelationshipDiagram", async () => {
      try {
        const diagramProvider = RelationshipDiagramProvider.getInstance(context);
        await diagramProvider.refreshDiagram();
      } catch (error) {
        vscode.window.showErrorMessage(`Error refreshing relationship diagram: ${error}`);
      }
    })
  );
}

// Export the command functions if needed elsewhere
export { scaffoldController, scaffoldRoute, scaffoldMiddleware, scaffoldServiceProvider, scaffoldJob, scaffoldCommand, scaffoldValidation };
