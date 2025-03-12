import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export function isExpressWebJsProject(): boolean {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return false;
  }

  const rootPath = workspaceFolders[0].uri.fsPath;

  // Look for package.json with expresswebjs dependency
  try {
    const packageJsonPath = path.join(rootPath, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      const hasExpressWebJsDependency = packageJson.dependencies && (packageJson.dependencies.expresswebjs || packageJson.devDependencies?.expresswebjs);

      if (hasExpressWebJsDependency) {
        return true;
      }

      // Secondary check - look for common ExpressWebJs folders
      const foldersToCheck = ["controllers", "routes", "middleware", "models"];
      const hasFolders = foldersToCheck.some((folder) => fs.existsSync(path.join(rootPath, folder)));

      return hasFolders;
    }
  } catch (error) {
    console.error("Error checking package.json:", error);
  }

  return false;
}

export function findExpressWebJsFiles(fileType: string): Promise<vscode.Uri[]> {
  if (!vscode.workspace.workspaceFolders) {
    return Promise.resolve([]);
  }

  let pattern: string;

  switch (fileType) {
    case "controllers":
      pattern = "**/controllers/**/*.{js,ts}";
      break;
    case "routes":
      pattern = "**/routes/**/*.{js,ts}";
      break;
    case "middleware":
      pattern = "**/middleware/**/*.{js,ts}";
      break;
    case "models":
      pattern = "**/models/**/*.{js,ts}";
      break;
    case "serviceProviders":
      pattern = "**/providers/**/*.{js,ts}";
      break;
    default:
      pattern = "**/*.{js,ts}";
  }

  const relativePattern = new vscode.RelativePattern(vscode.workspace.workspaceFolders[0], pattern);

  return new Promise<vscode.Uri[]>((resolve, reject) => {
    vscode.workspace.findFiles(relativePattern).then(resolve, reject);
  });
}

// Gets the imports at cursor position to provide better context-aware completions
export function getImportsAtPosition(document: vscode.TextDocument, position: vscode.Position): string[] {
  const text = document.getText();
  const imports: string[] = [];

  // Simple regex to extract imported module names
  const importRegex = /import\s+.*?from\s+['"](.+?)['"]/g;
  let match;

  while ((match = importRegex.exec(text)) !== null) {
    if (match[1]) {
      imports.push(match[1]);
    }
  }

  return imports;
}

// Detect the context in which the user is writing code
export function detectContext(document: vscode.TextDocument, position: vscode.Position): string {
  const lineText = document.lineAt(position.line).text;
  const textBeforeCursor = lineText.substring(0, position.character);

  if (textBeforeCursor.includes("router.") || textBeforeCursor.match(/Route|Routes/)) {
    return "routing";
  }

  if (textBeforeCursor.includes("request.") || textBeforeCursor.includes("file")) {
    return "fileUpload";
  }

  if (textBeforeCursor.match(/Controller/) || lineText.match(/class\s+\w+Controller/) || document.fileName.includes("controllers")) {
    return "controller";
  }

  if (textBeforeCursor.match(/middleware/) || document.fileName.includes("middleware")) {
    return "middleware";
  }

  // Default
  return "unknown";
}
