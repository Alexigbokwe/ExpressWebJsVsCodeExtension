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
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const index_1 = require("./commands/index");
const relationshipAnalyzer_1 = require("./utils/relationshipAnalyzer");
const relationshipDiagram_1 = require("./visualizers/relationshipDiagram"); // Add this import
function activate(context) {
    console.log("ExpresswebJs extension is now active");
    // Register commands
    (0, index_1.registerCommands)(context);
    // Clear relationship cache when files change
    const fileWatcher = vscode.workspace.createFileSystemWatcher("**/*.{ts,js}");
    // Throttled refresh to avoid too many updates
    let refreshTimer = null;
    const throttledRefresh = () => {
        if (refreshTimer) {
            clearTimeout(refreshTimer);
        }
        refreshTimer = setTimeout(() => {
            (0, relationshipAnalyzer_1.clearProjectCache)();
            // Also refresh diagram if it's currently open
            const diagramProvider = relationshipDiagram_1.RelationshipDiagramProvider.getInstance(context);
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
exports.activate = activate;
function deactivate() {
    console.log("ExpresswebJs extension deactivated");
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map