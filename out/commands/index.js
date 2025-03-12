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
exports.registerCommands = registerCommands;
const vscode = __importStar(require("vscode"));
const scaffolding_1 = require("./scaffolding");
const relationshipDiagram_1 = require("../visualizers/relationshipDiagram");
function registerCommands(context) {
    // Register existing command
    const infoCommand = vscode.commands.registerCommand("expresswebjs.someCommand", () => {
        vscode.window.showInformationMessage("ExpresswebJs command executed!");
    });
    // Register scaffolding commands
    const controllerCommand = vscode.commands.registerCommand("expresswebjs.scaffoldController", () => {
        (0, scaffolding_1.scaffoldController)();
    });
    const routeCommand = vscode.commands.registerCommand("expresswebjs.scaffoldRoute", () => {
        (0, scaffolding_1.scaffoldRoute)();
    });
    const middlewareCommand = vscode.commands.registerCommand("expresswebjs.scaffoldMiddleware", () => {
        (0, scaffolding_1.scaffoldMiddleware)();
    });
    const serviceProviderCommand = vscode.commands.registerCommand("expresswebjs.scaffoldServiceProvider", () => {
        (0, scaffolding_1.scaffoldServiceProvider)();
    });
    // Register new scaffolding commands
    const jobCommand = vscode.commands.registerCommand("expresswebjs.scaffoldJob", () => {
        (0, scaffolding_1.scaffoldJob)();
    });
    const commandCommand = vscode.commands.registerCommand("expresswebjs.scaffoldCommand", () => {
        (0, scaffolding_1.scaffoldCommand)();
    });
    const validationCommand = vscode.commands.registerCommand("expresswebjs.scaffoldValidation", () => {
        (0, scaffolding_1.scaffoldValidation)();
    });
    // Register object relationship diagram command
    const showRelationshipDiagramCommand = vscode.commands.registerCommand("expresswebjs.showRelationshipDiagram", async () => {
        try {
            const diagramProvider = relationshipDiagram_1.RelationshipDiagramProvider.getInstance(context);
            await diagramProvider.openDiagram();
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error showing relationship diagram: ${error}`);
        }
    });
    // Register refresh diagram command
    const refreshRelationshipDiagramCommand = vscode.commands.registerCommand("expresswebjs.refreshRelationshipDiagram", async () => {
        try {
            const diagramProvider = relationshipDiagram_1.RelationshipDiagramProvider.getInstance(context);
            await diagramProvider.refreshDiagram();
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error refreshing relationship diagram: ${error}`);
        }
    });
    context.subscriptions.push(infoCommand, controllerCommand, routeCommand, middlewareCommand, serviceProviderCommand, jobCommand, commandCommand, validationCommand, showRelationshipDiagramCommand, refreshRelationshipDiagramCommand);
}
//# sourceMappingURL=index.js.map