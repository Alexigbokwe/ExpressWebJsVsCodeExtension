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
exports.ExpressWebJsCommandsProvider = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Custom TreeItem with additional properties
 */
class ExpressWebJsTreeItem extends vscode.TreeItem {
    constructor(label, collapsibleState, options) {
        super(label, collapsibleState);
        if (options) {
            this.categoryIndex = options.categoryIndex;
            this.commandIndex = options.commandIndex;
            this.command = options.command;
            this.description = options.description;
            this.tooltip = options.tooltip;
            this.contextValue = options.contextValue;
        }
    }
}
/**
 * TreeView provider for ExpressWebJs commands
 */
class ExpressWebJsCommandsProvider {
    constructor(context) {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.context = context;
        // Define command categories for the tree view
        this.categories = [
            {
                label: "🔨 Scaffolding",
                collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
                commands: [
                    {
                        label: "Controller",
                        command: "expresswebjs.scaffoldController",
                        description: "Create a new controller",
                    },
                    {
                        label: "Route",
                        command: "expresswebjs.scaffoldRoute",
                        description: "Create a new route",
                    },
                    {
                        label: "Middleware",
                        command: "expresswebjs.scaffoldMiddleware",
                        description: "Create a new middleware",
                    },
                    {
                        label: "ServiceProvider",
                        command: "expresswebjs.scaffoldServiceProvider",
                        description: "Create a new service provider",
                    },
                    {
                        label: "Job",
                        command: "expresswebjs.scaffoldJob",
                        description: "Create a new background job",
                    },
                    {
                        label: "Command",
                        command: "expresswebjs.scaffoldCommand",
                        description: "Create a new command",
                    },
                    {
                        label: "Validation",
                        command: "expresswebjs.scaffoldValidation",
                        description: "Create a new validation",
                    },
                ],
            },
            {
                label: "📊 Visualization",
                collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
                commands: [
                    {
                        label: "Show Relationship Diagram",
                        command: "expresswebjs.showRelationshipDiagram",
                        description: "Show object relationships",
                    },
                    {
                        label: "Refresh Diagram",
                        command: "expresswebjs.refreshRelationshipDiagram",
                        description: "Refresh relationship diagram",
                    },
                ],
            },
        ];
    }
    /**
     * Refresh the tree view
     */
    refresh() {
        console.log("Refreshing ExpressWebJs commands tree view");
        this._onDidChangeTreeData.fire(null);
    }
    /**
     * Get the children elements for the tree view
     *
     * @param element - The element to get children for
     * @returns The children elements
     */
    getChildren(element) {
        // For debugging
        console.log("getChildren called", element);
        if (!element) {
            // Root level - return all categories
            return Promise.resolve(this.categories.map((category, index) => this._createCategoryItem(category, index)));
        }
        // If element is a category, return its commands
        if (element.categoryIndex !== undefined && element.commandIndex === undefined) {
            const category = this.categories[element.categoryIndex];
            return Promise.resolve(category.commands.map((cmd, index) => this._createCommandItem(cmd, element.categoryIndex, index)));
        }
        return Promise.resolve([]);
    }
    /**
     * Get the parent of an element
     */
    getParent(element) {
        if (element.categoryIndex !== undefined && element.commandIndex !== undefined) {
            // This is a command item, return its parent category
            return this._createCategoryItem(this.categories[element.categoryIndex], element.categoryIndex);
        }
        return null;
    }
    /**
     * Get the TreeItem representation of an element
     */
    getTreeItem(element) {
        return element;
    }
    /**
     * Create a tree item for a category
     */
    _createCategoryItem(category, index) {
        const item = new ExpressWebJsTreeItem(category.label, category.collapsibleState, {
            categoryIndex: index,
            contextValue: "expresswebjsCategory",
        });
        item.tooltip = `${category.commands.length} commands`;
        return item;
    }
    /**
     * Create a tree item for a command
     */
    _createCommandItem(cmdData, categoryIndex, commandIndex) {
        return new ExpressWebJsTreeItem(cmdData.label, vscode.TreeItemCollapsibleState.None, {
            categoryIndex: categoryIndex,
            commandIndex: commandIndex,
            command: {
                command: cmdData.command,
                title: cmdData.label,
            },
            description: cmdData.description,
            tooltip: cmdData.description,
            contextValue: "expresswebjsCommand",
        });
    }
}
exports.ExpressWebJsCommandsProvider = ExpressWebJsCommandsProvider;
//# sourceMappingURL=treeViewProvider.js.map