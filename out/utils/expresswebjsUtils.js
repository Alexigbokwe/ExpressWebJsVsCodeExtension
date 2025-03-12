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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findRoutes = exports.findControllers = exports.getDefinition = exports.formatErrorMessage = exports.validateConfig = exports.parseConfig = void 0;
const vscode = __importStar(require("vscode"));
function parseConfig(config) {
    try {
        return JSON.parse(config);
    }
    catch (error) {
        throw new Error("Invalid configuration format: " + error.message);
    }
}
exports.parseConfig = parseConfig;
function validateConfig(config, schema) {
    // Implement validation logic against the schema
    // This is a placeholder for actual validation logic
    return true;
}
exports.validateConfig = validateConfig;
function formatErrorMessage(error) {
    return `Error: ${error.message}`;
}
exports.formatErrorMessage = formatErrorMessage;
function getDefinition(word, document) {
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
exports.getDefinition = getDefinition;
// Helper function to find ExpressWebJs controllers in the workspace
async function findControllers() {
    if (!vscode.workspace.workspaceFolders) {
        return [];
    }
    const pattern = new vscode.RelativePattern(vscode.workspace.workspaceFolders[0], "**/controllers/**/*.{js,ts}");
    return await vscode.workspace.findFiles(pattern);
}
exports.findControllers = findControllers;
// Helper function to find ExpressWebJs routes in the workspace
async function findRoutes() {
    if (!vscode.workspace.workspaceFolders) {
        return [];
    }
    const pattern = new vscode.RelativePattern(vscode.workspace.workspaceFolders[0], "**/routes/**/*.{js,ts}");
    return await vscode.workspace.findFiles(pattern);
}
exports.findRoutes = findRoutes;
//# sourceMappingURL=expresswebjsUtils.js.map