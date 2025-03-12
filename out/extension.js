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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const index_1 = require("./commands/index");
const relationshipAnalyzer_1 = require("./utils/relationshipAnalyzer");
const relationshipDiagram_1 = require("./visualizers/relationshipDiagram");
const treeViewProvider_1 = require("./treeViewProvider");
let treeView;
let commandsProvider;
function activate(context) {
    console.log("ExpresswebJs extension is now active");
    // Register commands - this should register scaffoldController already
    (0, index_1.registerCommands)(context);
    // Only create the tree view if it doesn't exist
    if (!treeView) {
        // Create the provider and store a reference to it
        commandsProvider = new treeViewProvider_1.ExpressWebJsCommandsProvider(context);
        // Create the tree view using the provider
        treeView = vscode.window.createTreeView("expresswebjs-commands", {
            treeDataProvider: commandsProvider,
            showCollapseAll: true,
        });
        context.subscriptions.push(treeView);
    }
    // Register the refresh command for the treeview
    context.subscriptions.push(vscode.commands.registerCommand("expresswebjs.refreshTreeView", () => {
        // Use the stored provider reference instead of trying to access it through treeView
        if (commandsProvider) {
            commandsProvider.refresh();
        }
    }));
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
function deactivate() {
    console.log("ExpresswebJs extension deactivated");
}
//# sourceMappingURL=extension.js.map