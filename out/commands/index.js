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
exports.scaffoldValidation = exports.scaffoldCommand = exports.scaffoldJob = exports.scaffoldServiceProvider = exports.scaffoldMiddleware = exports.scaffoldRoute = exports.scaffoldController = void 0;
exports.registerCommands = registerCommands;
const vscode = __importStar(require("vscode"));
const scaffolding_1 = require("./scaffolding");
Object.defineProperty(exports, "scaffoldController", { enumerable: true, get: function () { return scaffolding_1.scaffoldController; } });
Object.defineProperty(exports, "scaffoldRoute", { enumerable: true, get: function () { return scaffolding_1.scaffoldRoute; } });
Object.defineProperty(exports, "scaffoldMiddleware", { enumerable: true, get: function () { return scaffolding_1.scaffoldMiddleware; } });
Object.defineProperty(exports, "scaffoldServiceProvider", { enumerable: true, get: function () { return scaffolding_1.scaffoldServiceProvider; } });
Object.defineProperty(exports, "scaffoldJob", { enumerable: true, get: function () { return scaffolding_1.scaffoldJob; } });
Object.defineProperty(exports, "scaffoldCommand", { enumerable: true, get: function () { return scaffolding_1.scaffoldCommand; } });
Object.defineProperty(exports, "scaffoldValidation", { enumerable: true, get: function () { return scaffolding_1.scaffoldValidation; } });
const relationshipDiagram_1 = require("../visualizers/relationshipDiagram");
// Register all commands in one place
function registerCommands(context) {
    // Register existing command
    const infoCommand = vscode.commands.registerCommand("expresswebjs.someCommand", () => {
        vscode.window.showInformationMessage("ExpresswebJs command executed!");
    });
    // Register all commands here
    context.subscriptions.push(infoCommand, vscode.commands.registerCommand("expresswebjs.scaffoldController", scaffolding_1.scaffoldController), vscode.commands.registerCommand("expresswebjs.scaffoldRoute", scaffolding_1.scaffoldRoute), vscode.commands.registerCommand("expresswebjs.scaffoldMiddleware", scaffolding_1.scaffoldMiddleware), vscode.commands.registerCommand("expresswebjs.scaffoldServiceProvider", scaffolding_1.scaffoldServiceProvider), vscode.commands.registerCommand("expresswebjs.scaffoldJob", scaffolding_1.scaffoldJob), vscode.commands.registerCommand("expresswebjs.scaffoldCommand", scaffolding_1.scaffoldCommand), vscode.commands.registerCommand("expresswebjs.scaffoldValidation", scaffolding_1.scaffoldValidation), vscode.commands.registerCommand("expresswebjs.showRelationshipDiagram", async () => {
        try {
            const diagramProvider = relationshipDiagram_1.RelationshipDiagramProvider.getInstance(context);
            await diagramProvider.openDiagram();
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error showing relationship diagram: ${error}`);
        }
    }), vscode.commands.registerCommand("expresswebjs.refreshRelationshipDiagram", async () => {
        try {
            const diagramProvider = relationshipDiagram_1.RelationshipDiagramProvider.getInstance(context);
            await diagramProvider.refreshDiagram();
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error refreshing relationship diagram: ${error}`);
        }
    }));
}
//# sourceMappingURL=index.js.map