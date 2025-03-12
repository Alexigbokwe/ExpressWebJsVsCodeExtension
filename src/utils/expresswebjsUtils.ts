import * as ts from "typescript";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export function parseConfig(config: string): object {
  try {
    return JSON.parse(config);
  } catch (error: any) {
    throw new Error("Invalid configuration format: " + error.message);
  }
}

export function validateConfig(config: object, schema: object): boolean {
  // Implement validation logic against the schema
  // This is a placeholder for actual validation logic
  return true;
}

export function formatErrorMessage(error: Error): string {
  return `Error: ${error.message}`;
}

export function getDefinition(word: string, document: vscode.TextDocument): vscode.Position | null {
  // This is a simplified implementation
  // In a real-world scenario, you'd parse the document or workspace
  // to find actual definitions of ExpressWebJs elements

  switch (word) {
    case "app":
    case "router":
    case "Controller":
    case "middleware":
      // Would actually navigate to node_modules or project files where these are defined
      return new vscode.Position(0, 0);
    default:
      return null;
  }
}

// Helper function to find ExpressWebJs controllers in the workspace
export async function findControllers(): Promise<vscode.Uri[]> {
  if (!vscode.workspace.workspaceFolders) {
    return [];
  }

  const pattern = new vscode.RelativePattern(vscode.workspace.workspaceFolders[0], "**/controllers/**/*.{js,ts}");

  return await vscode.workspace.findFiles(pattern);
}

// Helper function to find ExpressWebJs routes in the workspace
export async function findRoutes(): Promise<vscode.Uri[]> {
  if (!vscode.workspace.workspaceFolders) {
    return [];
  }

  const pattern = new vscode.RelativePattern(vscode.workspace.workspaceFolders[0], "**/routes/**/*.{js,ts}");

  return await vscode.workspace.findFiles(pattern);
}
