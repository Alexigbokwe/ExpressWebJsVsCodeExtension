import * as vscode from "vscode";

/**
 * Interface for ExpressWebJs command item
 */
interface CommandItem {
  label: string;
  command: string;
  description: string;
  icon?: string;
}

/**
 * Interface for ExpressWebJs command category
 */
interface CommandCategory {
  label: string;
  collapsibleState: vscode.TreeItemCollapsibleState;
  commands: CommandItem[];
}

/**
 * Custom TreeItem with additional properties
 */
class ExpressWebJsTreeItem extends vscode.TreeItem {
  categoryIndex?: number;
  commandCategory?: number;
  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    options?: {
      categoryIndex?: number;
      commandCategory?: number;
      command?: vscode.Command;
      description?: string;
      tooltip?: string;
      contextValue?: string;
    }
  ) {
    super(label, collapsibleState);

    if (options) {
      this.categoryIndex = options.categoryIndex;
      this.commandCategory = options.commandCategory;
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
export class ExpressWebJsCommandsProvider implements vscode.TreeDataProvider<ExpressWebJsTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ExpressWebJsTreeItem | undefined | null> = new vscode.EventEmitter<ExpressWebJsTreeItem | undefined | null>();
  readonly onDidChangeTreeData: vscode.Event<ExpressWebJsTreeItem | undefined | null> = this._onDidChangeTreeData.event;

  private readonly context: vscode.ExtensionContext;
  private readonly categories: CommandCategory[];

  constructor(context: vscode.ExtensionContext) {
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
            label: "Service Provider",
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
      // {
      //   label: "📦 Package Analysis",
      //   collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
      //   commands: [
      //     {
      //       label: "Analyze Dependencies",
      //       command: "expresswebjs.analyzePackages",
      //       description: "Analyze project dependencies",
      //     },
      //   ],
      // },
    ];
  }

  /**
   * Refresh the tree view
   */
  refresh(): void {
    this._onDidChangeTreeData.fire(null);
  }

  /**
   * Get the children elements for the tree view
   *
   * @param element - The element to get children for
   * @returns The children elements
   */
  getChildren(element?: ExpressWebJsTreeItem): Thenable<ExpressWebJsTreeItem[]> {
    if (!element) {
      // Root level - return all categories
      return Promise.resolve(this.categories.map((category, index) => this._createCategoryItem(category, index)));
    }

    // If element is a category, return its commands
    if (element.categoryIndex !== undefined) {
      const category = this.categories[element.categoryIndex];
      return Promise.resolve(category.commands.map((cmd, index) => this._createCommandItem(cmd, element.categoryIndex!)));
    }

    return Promise.resolve([]);
  }

  /**
   * Get the parent of an element - required for TreeDataProvider
   */
  getParent(element: ExpressWebJsTreeItem): vscode.ProviderResult<ExpressWebJsTreeItem> {
    if (element.categoryIndex !== undefined && element.commandCategory === undefined) {
      // This is a category item, no parent
      return null;
    }

    if (element.commandCategory !== undefined) {
      // Command items - return their parent category
      return this._createCategoryItem(this.categories[element.commandCategory], element.commandCategory);
    }

    return null;
  }

  /**
   * Get the TreeItem representation of an element
   */
  getTreeItem(element: ExpressWebJsTreeItem): vscode.TreeItem {
    return element;
  }

  /**
   * Create a tree item for a category
   *
   * @param category - Category data
   * @param index - Category index
   * @returns The created TreeItem
   */
  private _createCategoryItem(category: CommandCategory, index: number): ExpressWebJsTreeItem {
    return new ExpressWebJsTreeItem(category.label, category.collapsibleState, {
      categoryIndex: index,
      contextValue: "expresswebjsCategory",
    });
  }

  /**
   * Create a tree item for a command
   *
   * @param cmdData - Command data
   * @param categoryIndex - Parent category index
   * @returns The created TreeItem
   */
  private _createCommandItem(cmdData: CommandItem, categoryIndex: number): ExpressWebJsTreeItem {
    return new ExpressWebJsTreeItem(cmdData.label, vscode.TreeItemCollapsibleState.None, {
      commandCategory: categoryIndex,
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
