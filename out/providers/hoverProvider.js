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
exports.HoverProvider = void 0;
const vscode = __importStar(require("vscode"));
class HoverProvider {
    provideHover(document, position, token) {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return null;
        }
        const word = document.getText(wordRange);
        const lineText = document.lineAt(position.line).text;
        // File Upload methods
        if (lineText.includes("request.") && this.isFileUploadMethod(word)) {
            return this.getFileUploadHover(word);
        }
        // Routing methods
        if ((lineText.includes("router.") || lineText.includes("app.")) && this.isRoutingMethod(word)) {
            return this.getRoutingHover(word);
        }
        // Controller methods
        if (lineText.includes("Controller") && this.isControllerMethod(word)) {
            return this.getControllerMethodHover(word);
        }
        return null;
    }
    isFileUploadMethod(word) {
        return ["hasFile", "file", "files", "storeFile", "storeFiles"].includes(word);
    }
    isRoutingMethod(word) {
        return ["get", "post", "put", "delete", "patch", "head", "options", "use", "group", "domain", "middleware", "prefix", "resource", "apiResource"].includes(word);
    }
    isControllerMethod(word) {
        return ["index", "create", "store", "show", "edit", "update", "destroy"].includes(word);
    }
    getFileUploadHover(method) {
        let content = "";
        switch (method) {
            case "hasFile":
                content = "```typescript\nrequest.hasFile(fieldName: string): boolean\n```\n\n" + "Checks if the request contains a file with the given field name.";
                break;
            case "file":
                content = "```typescript\nrequest.file(fieldName: string): File\n```\n\n" + "Gets a file from the request with the given field name.\n\n" + "Returns a File object with properties like:\n" + "- `name`: Original file name\n" + "- `size`: File size in bytes\n" + "- `mimetype`: MIME type\n" + "- `tempFilePath`: Temporary file path";
                break;
            case "files":
                content = "```typescript\nrequest.files(): Array<File>\n```\n\n" + "Gets all files from the request.";
                break;
            case "storeFile":
                content = "```typescript\nrequest.storeFile(fieldName: string, path: string): Promise<string>\n```\n\n" + "Stores an uploaded file to the specified path.\n\n" + "Returns a Promise that resolves to the saved file path.";
                break;
            case "storeFiles":
                content = "```typescript\nrequest.storeFiles(fieldName: string, path: string): Promise<Array<string>>\n```\n\n" + "Stores multiple uploaded files to the specified path.\n\n" + "Returns a Promise that resolves to an array of saved file paths.";
                break;
        }
        return new vscode.Hover(new vscode.MarkdownString(content));
    }
    getRoutingHover(method) {
        let content = "";
        switch (method) {
            case "get":
            case "post":
            case "put":
            case "delete":
            case "patch":
            case "head":
            case "options":
                content = `\`\`\`typescript\nrouter.${method}(path: string, handler: Function | Controller): Router\n\`\`\`\n\n` + `Handles ${method.toUpperCase()} HTTP method requests for the specified path.`;
                break;
            case "use":
                content = "```typescript\nrouter.use(middleware: Function | Array<Function>): Router\n```\n\n" + "Apply middleware to all routes defined by this router.";
                break;
            case "group":
                content = "```typescript\nrouter.group(prefix: string, callback: Function): Router\n```\n\n" + "Create a route group with a common prefix.";
                break;
            case "domain":
                content = "```typescript\nrouter.domain(domain: string, callback: Function): Router\n```\n\n" + "Group routes by domain.";
                break;
            case "middleware":
                content = "```typescript\nrouter.middleware(middlewareList: Array<Function>, callback: Function): Router\n```\n\n" + "Apply middleware to a group of routes.";
                break;
            case "prefix":
                content = "```typescript\nrouter.prefix(prefix: string, callback: Function): Router\n```\n\n" + "Add prefix to a group of routes.";
                break;
            case "resource":
                content = "```typescript\nrouter.resource(path: string, controller: Controller): Router\n```\n\n" + "Create resourceful routes for a controller:\n" + "- GET /path - controller.index\n" + "- GET /path/create - controller.create\n" + "- POST /path - controller.store\n" + "- GET /path/:id - controller.show\n" + "- GET /path/:id/edit - controller.edit\n" + "- PUT/PATCH /path/:id - controller.update\n" + "- DELETE /path/:id - controller.destroy";
                break;
            case "apiResource":
                content = "```typescript\nrouter.apiResource(path: string, controller: Controller): Router\n```\n\n" + "Create API resourceful routes for a controller:\n" + "- GET /path - controller.index\n" + "- POST /path - controller.store\n" + "- GET /path/:id - controller.show\n" + "- PUT/PATCH /path/:id - controller.update\n" + "- DELETE /path/:id - controller.destroy";
                break;
        }
        return new vscode.Hover(new vscode.MarkdownString(content));
    }
    getControllerMethodHover(method) {
        let content = "";
        switch (method) {
            case "index":
                content = "```typescript\nindex(request, response): void\n```\n\n" + "Display a listing of the resource.\n\n" + "Typically corresponds to GET /resource";
                break;
            case "create":
                content = "```typescript\ncreate(request, response): void\n```\n\n" + "Show the form for creating a new resource.\n\n" + "Typically corresponds to GET /resource/create";
                break;
            case "store":
                content = "```typescript\nstore(request, response): void\n```\n\n" + "Store a newly created resource.\n\n" + "Typically corresponds to POST /resource";
                break;
            case "show":
                content = "```typescript\nshow(request, response): void\n```\n\n" + "Display the specified resource.\n\n" + "Typically corresponds to GET /resource/:id";
                break;
            case "edit":
                content = "```typescript\nedit(request, response): void\n```\n\n" + "Show the form for editing the specified resource.\n\n" + "Typically corresponds to GET /resource/:id/edit";
                break;
            case "update":
                content = "```typescript\nupdate(request, response): void\n```\n\n" + "Update the specified resource.\n\n" + "Typically corresponds to PUT/PATCH /resource/:id";
                break;
            case "destroy":
                content = "```typescript\ndestroy(request, response): void\n```\n\n" + "Remove the specified resource.\n\n" + "Typically corresponds to DELETE /resource/:id";
                break;
        }
        return new vscode.Hover(new vscode.MarkdownString(content));
    }
}
exports.HoverProvider = HoverProvider;
//# sourceMappingURL=hoverProvider.js.map