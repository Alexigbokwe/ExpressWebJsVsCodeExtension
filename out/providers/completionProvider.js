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
exports.CompletionProvider = void 0;
const vscode = __importStar(require("vscode"));
class CompletionProvider {
    provideCompletionItems(document, position, token, context) {
        const linePrefix = document.lineAt(position).text.substr(0, position.character);
        const completionItems = [];
        // Check for file upload related code
        if (linePrefix.includes("request.")) {
            this.addRequestFileCompletions(completionItems);
        }
        // Check for routing related code
        if (linePrefix.match(/router\.\s*$/) || linePrefix.match(/app\.\s*$/)) {
            this.addRoutingCompletions(completionItems);
        }
        // Check for Controller methods
        if (linePrefix.match(/Controller/)) {
            this.addControllerCompletions(completionItems);
        }
        return completionItems;
    }
    addRequestFileCompletions(items) {
        // File upload related methods
        const fileUploadMethods = [
            {
                name: "hasFile",
                description: "Check if the request contains a file",
                snippet: "hasFile('${1:fieldName}')$0",
                detail: "boolean",
            },
            {
                name: "file",
                description: "Get file from request by field name",
                snippet: "file('${1:fieldName}')$0",
                detail: "File",
            },
            {
                name: "files",
                description: "Get all files from the request",
                snippet: "files()$0",
                detail: "Array<File>",
            },
            {
                name: "storeFile",
                description: "Store uploaded file to specified location",
                snippet: "storeFile('${1:fieldName}', '${2:path}')$0",
                detail: "Promise<string>",
            },
            {
                name: "storeFiles",
                description: "Store multiple uploaded files to specified location",
                snippet: "storeFiles('${1:fieldName}', '${2:path}')$0",
                detail: "Promise<Array<string>>",
            },
        ];
        fileUploadMethods.forEach((method) => {
            const item = new vscode.CompletionItem(method.name, vscode.CompletionItemKind.Method);
            item.documentation = new vscode.MarkdownString(method.description);
            item.insertText = new vscode.SnippetString(method.snippet);
            item.detail = method.detail;
            items.push(item);
        });
    }
    addRoutingCompletions(items) {
        // HTTP method completions
        const httpMethods = [
            {
                name: "get",
                description: "Handle GET HTTP method requests",
                snippet: "get('${1:path}', ${2:(request, response) => {\n\t$0\n}})$3",
                detail: "HTTP GET method",
            },
            {
                name: "post",
                description: "Handle POST HTTP method requests",
                snippet: "post('${1:path}', ${2:(request, response) => {\n\t$0\n}})$3",
                detail: "HTTP POST method",
            },
            {
                name: "put",
                description: "Handle PUT HTTP method requests",
                snippet: "put('${1:path}', ${2:(request, response) => {\n\t$0\n}})$3",
                detail: "HTTP PUT method",
            },
            {
                name: "delete",
                description: "Handle DELETE HTTP method requests",
                snippet: "delete('${1:path}', ${2:(request, response) => {\n\t$0\n}})$3",
                detail: "HTTP DELETE method",
            },
            {
                name: "patch",
                description: "Handle PATCH HTTP method requests",
                snippet: "patch('${1:path}', ${2:(request, response) => {\n\t$0\n}})$3",
                detail: "HTTP PATCH method",
            },
            {
                name: "head",
                description: "Handle HEAD HTTP method requests",
                snippet: "head('${1:path}', ${2:(request, response) => {\n\t$0\n}})$3",
                detail: "HTTP HEAD method",
            },
            {
                name: "options",
                description: "Handle OPTIONS HTTP method requests",
                snippet: "options('${1:path}', ${2:(request, response) => {\n\t$0\n}})$3",
                detail: "HTTP OPTIONS method",
            },
            // Router specific methods
            {
                name: "use",
                description: "Use middleware for all routes defined by this router",
                snippet: "use(${1:middleware})$0",
                detail: "Apply middleware to routes",
            },
            {
                name: "group",
                description: "Create a route group with a common prefix",
                snippet: "group('${1:prefix}', ${2:(router) => {\n\t$0\n}})$3",
                detail: "Route grouping",
            },
            {
                name: "domain",
                description: "Group routes by domain",
                snippet: "domain('${1:domain}', ${2:(router) => {\n\t$0\n}})$3",
                detail: "Domain routing",
            },
            {
                name: "middleware",
                description: "Apply middleware to routes",
                snippet: "middleware([${1:middlewareList}], ${2:(router) => {\n\t$0\n}})$3",
                detail: "Apply middleware to grouped routes",
            },
            {
                name: "prefix",
                description: "Add prefix to a group of routes",
                snippet: "prefix('${1:prefix}', ${2:(router) => {\n\t$0\n}})$3",
                detail: "Add prefix to routes",
            },
            {
                name: "resource",
                description: "Create a resourceful route for a controller",
                snippet: "resource('${1:path}', ${2:Controller})$0",
                detail: "Resourceful routing",
            },
            {
                name: "apiResource",
                description: "Create an API resource route for a controller",
                snippet: "apiResource('${1:path}', ${2:Controller})$0",
                detail: "API resourceful routing",
            },
        ];
        httpMethods.forEach((method) => {
            const item = new vscode.CompletionItem(method.name, vscode.CompletionItemKind.Method);
            item.documentation = new vscode.MarkdownString(method.description);
            item.insertText = new vscode.SnippetString(method.snippet);
            item.detail = method.detail;
            items.push(item);
        });
    }
    addControllerCompletions(items) {
        // Controller methods
        const controllerMethods = [
            {
                name: "index",
                description: "Display a listing of the resource",
                snippet: "index(request, response) {\n\t$0\n}",
                detail: "List resources",
            },
            {
                name: "create",
                description: "Show the form for creating a new resource",
                snippet: "create(request, response) {\n\t$0\n}",
                detail: "Display creation form",
            },
            {
                name: "store",
                description: "Store a newly created resource",
                snippet: "store(request, response) {\n\t$0\n}",
                detail: "Store new resource",
            },
            {
                name: "show",
                description: "Display the specified resource",
                snippet: "show(request, response) {\n\t$0\n}",
                detail: "Show resource",
            },
            {
                name: "edit",
                description: "Show the form for editing the specified resource",
                snippet: "edit(request, response) {\n\t$0\n}",
                detail: "Display edit form",
            },
            {
                name: "update",
                description: "Update the specified resource",
                snippet: "update(request, response) {\n\t$0\n}",
                detail: "Update resource",
            },
            {
                name: "destroy",
                description: "Remove the specified resource",
                snippet: "destroy(request, response) {\n\t$0\n}",
                detail: "Delete resource",
            },
        ];
        controllerMethods.forEach((method) => {
            const item = new vscode.CompletionItem(method.name, vscode.CompletionItemKind.Method);
            item.documentation = new vscode.MarkdownString(method.description);
            item.insertText = new vscode.SnippetString(method.snippet);
            item.detail = method.detail;
            items.push(item);
        });
    }
}
exports.CompletionProvider = CompletionProvider;
//# sourceMappingURL=completionProvider.js.map