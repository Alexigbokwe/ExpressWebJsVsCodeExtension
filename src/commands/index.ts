import * as vscode from "vscode";
import { scaffoldController, scaffoldRoute, scaffoldMiddleware, scaffoldServiceProvider, scaffoldJob, scaffoldCommand, scaffoldValidation } from "./scaffolding";
import { RelationshipDiagramProvider } from "../visualizers/relationshipDiagram";

export function registerCommands(context: vscode.ExtensionContext) {
  // Register existing command
  const infoCommand = vscode.commands.registerCommand("expresswebjs.someCommand", () => {
    vscode.window.showInformationMessage("ExpresswebJs command executed!");
  });

  // Register scaffolding commands
  const controllerCommand = vscode.commands.registerCommand("expresswebjs.scaffoldController", () => {
    scaffoldController();
  });

  const routeCommand = vscode.commands.registerCommand("expresswebjs.scaffoldRoute", () => {
    scaffoldRoute();
  });

  const middlewareCommand = vscode.commands.registerCommand("expresswebjs.scaffoldMiddleware", () => {
    scaffoldMiddleware();
  });

  const serviceProviderCommand = vscode.commands.registerCommand("expresswebjs.scaffoldServiceProvider", () => {
    scaffoldServiceProvider();
  });

  // Register new scaffolding commands
  const jobCommand = vscode.commands.registerCommand("expresswebjs.scaffoldJob", () => {
    scaffoldJob();
  });

  const commandCommand = vscode.commands.registerCommand("expresswebjs.scaffoldCommand", () => {
    scaffoldCommand();
  });

  const validationCommand = vscode.commands.registerCommand("expresswebjs.scaffoldValidation", () => {
    scaffoldValidation();
  });

  // Register object relationship diagram command
  const showRelationshipDiagramCommand = vscode.commands.registerCommand("expresswebjs.showRelationshipDiagram", async () => {
    try {
      const diagramProvider = RelationshipDiagramProvider.getInstance(context);
      await diagramProvider.openDiagram();
    } catch (error) {
      vscode.window.showErrorMessage(`Error showing relationship diagram: ${error}`);
    }
  });

  // Register refresh diagram command
  const refreshRelationshipDiagramCommand = vscode.commands.registerCommand("expresswebjs.refreshRelationshipDiagram", async () => {
    try {
      const diagramProvider = RelationshipDiagramProvider.getInstance(context);
      await diagramProvider.refreshDiagram();
    } catch (error) {
      vscode.window.showErrorMessage(`Error refreshing relationship diagram: ${error}`);
    }
  });

  context.subscriptions.push(infoCommand, controllerCommand, routeCommand, middlewareCommand, serviceProviderCommand, jobCommand, commandCommand, validationCommand, showRelationshipDiagramCommand, refreshRelationshipDiagramCommand);
}
