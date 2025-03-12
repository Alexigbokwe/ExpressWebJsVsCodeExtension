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
exports.isExpressWebJsProject = isExpressWebJsProject;
exports.findExpressWebJsFiles = findExpressWebJsFiles;
exports.getImportsAtPosition = getImportsAtPosition;
exports.detectContext = detectContext;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function isExpressWebJsProject() {
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
    }
    catch (error) {
        console.error("Error checking package.json:", error);
    }
    return false;
}
function findExpressWebJsFiles(fileType) {
    if (!vscode.workspace.workspaceFolders) {
        return Promise.resolve([]);
    }
    let pattern;
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
    return new Promise((resolve, reject) => {
        vscode.workspace.findFiles(relativePattern).then(resolve, reject);
    });
}
// Gets the imports at cursor position to provide better context-aware completions
function getImportsAtPosition(document, position) {
    const text = document.getText();
    const imports = [];
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
function detectContext(document, position) {
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
//# sourceMappingURL=projectUtils.js.map