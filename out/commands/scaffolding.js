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
exports.scaffoldController = scaffoldController;
exports.scaffoldRoute = scaffoldRoute;
exports.scaffoldMiddleware = scaffoldMiddleware;
exports.scaffoldServiceProvider = scaffoldServiceProvider;
exports.scaffoldJob = scaffoldJob;
exports.scaffoldCommand = scaffoldCommand;
exports.scaffoldValidation = scaffoldValidation;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Helper function to ensure directory exists
function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}
function convertToPascalCase(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}
async function scaffoldController() {
    const controllerName = await vscode.window.showInputBox({
        prompt: "Enter the name of the controller",
        placeHolder: "UserController",
    });
    if (!controllerName) {
        return; // User cancelled
    }
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage("No workspace folder open");
        return;
    }
    const rootPath = workspaceFolders[0].uri.fsPath;
    const controllerPath = path.join(rootPath, "App/Http/Controller", `${convertToPascalCase(controllerName)}.ts`);
    const controllerContent = `import { Request, Response } from "Config/Http";
  import { BaseController } from "./BaseController";

export class ${convertToPascalCase(controllerName)} extends BaseController {
    constructor() {
        super();
    }
    
    /**
     * Index method
     */
    index(req: Request, res: Response) {
        return this.response.OK(res, { message: 'Hello from ${controllerName}' });
    }
    
    /**
     * Show method
     */
    show(req: Request, res: Response) {
        const id = req.params["id"];
        return this.response.OK(res, { data: id });
    }
    
    /**
     * Store method
     */
    store(req: Request, res: Response) {
        return this.response.CREATED(res);
    }
    
    /**
     * Update method
     */
    update(req: Request, res: Response) {
        const id = req.params["id"];
        const data = req.body;
        return this.response.OK(res, { message: 'Updated successfully', id, data });
    }
    
    /**
     * Destroy method
     */
    destroy(req: Request, res: Response) {
        const id = req.params["id"];
        return this.response.OK(res, { message: 'Deleted successfully', id });
    }
}`;
    ensureDirectoryExistence(controllerPath);
    fs.writeFileSync(controllerPath, controllerContent);
    vscode.window.showInformationMessage(`Controller '${controllerName}' created successfully!`);
    const doc = await vscode.workspace.openTextDocument(controllerPath);
    vscode.window.showTextDocument(doc);
}
async function scaffoldRoute() {
    const routeName = await vscode.window.showInputBox({
        prompt: "Enter the name of the route file",
        placeHolder: "user",
    });
    if (!routeName) {
        return; // User cancelled
    }
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage("No workspace folder open");
        return;
    }
    const rootPath = workspaceFolders[0].uri.fsPath;
    const routePath = path.join(rootPath, `Routes/${convertToPascalCase(routeName)}`, "index.ts");
    const routeContent = `import { Route } from "Elucidate/Route/RouteManager";
  import { Request, Response } from "Config/Http";

/*
|--------------------------------------------------------------------------
| Route File   
|--------------------------------------------------------------------------
| Example of closure route 
| Route.get("/",(req:Request,res:Response)=>{}); 
|
| Example of controller route.
| Route.get("/","UserController@index");
| 
*/

Route.group({ prefix: "${routeName.toLowerCase()}" }, () => {
    Route.get('/:id', (req: Request, res: Response) => {
        const id = req.params["id"];
        res.send({ message: 'Hello from ${routeName}', id });
    });
});

//--------------------------------------------------------------------------
export default Route.exec;`;
    ensureDirectoryExistence(routePath);
    fs.writeFileSync(routePath, routeContent);
    vscode.window.showInformationMessage(`Route file '${routeName}' created successfully!`);
    const doc = await vscode.workspace.openTextDocument(routePath);
    vscode.window.showTextDocument(doc);
}
async function scaffoldMiddleware() {
    const middlewareName = await vscode.window.showInputBox({
        prompt: "Enter the name of the middleware",
        placeHolder: "Auth",
    });
    if (!middlewareName) {
        return; // User cancelled
    }
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage("No workspace folder open");
        return;
    }
    const rootPath = workspaceFolders[0].uri.fsPath;
    const middlewarePath = path.join(rootPath, "App/Http/Middleware", `${convertToPascalCase(middlewareName)}.ts`);
    const middlewareContent = `import { MiddlewareHandler } from "Elucidate/MiddlewareHandler";
  import { Request, Response } from "Config/Http";
  import { HttpResponse } from "Elucidate/HttpContext";

class ${convertToPascalCase(middlewareName)} extends MiddlewareHandler {
    override async preHandle(req: Request, res: Response): Promise<boolean> {
        // Your middleware logic here
        console.log('${middlewareName} middleware executed');
        
        // Example: check for authorization
        // if (!req.headers['authorization']) {
        //     HttpResponse.UNAUTHORIZED(res, {  message: 'Unauthorized' });
        //     return false;
        // }
        
        // Continue to the next middleware or route handler
        return true;
    }
}

export default  ${middlewareName};`;
    ensureDirectoryExistence(middlewarePath);
    fs.writeFileSync(middlewarePath, middlewareContent);
    vscode.window.showInformationMessage(`Middleware '${middlewareName}' created successfully!`);
    const doc = await vscode.workspace.openTextDocument(middlewarePath);
    vscode.window.showTextDocument(doc);
}
async function scaffoldServiceProvider() {
    const serviceProviderName = await vscode.window.showInputBox({
        prompt: "Enter the name of service provider",
        placeHolder: "ApplicationServiceProvider",
    });
    if (!serviceProviderName) {
        return; // User cancelled
    }
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage("No workspace folder open");
        return;
    }
    const rootPath = workspaceFolders[0].uri.fsPath;
    const modelPath = path.join(rootPath, "App/Providers", `${convertToPascalCase(serviceProviderName)}.ts`);
    const modelContent = `import { ServiceProvider } from "Elucidate/Support/ServiceProvider";

export class ${convertToPascalCase(serviceProviderName)} extends ServiceProvider {
  /**
   * Register any application services.
   * @return void
   */
  public register() {
    //
  }

  /**
   * Bootstrap any application services.
   * @return void
   */
  public async boot() {
    //
  }

  /**
   * Load any service after application boot stage
   * @return void
   */
  public async booted() {
   //
  }
}`;
    ensureDirectoryExistence(modelPath);
    fs.writeFileSync(modelPath, modelContent);
    vscode.window.showInformationMessage(`${serviceProviderName} created successfully!`);
    const doc = await vscode.workspace.openTextDocument(modelPath);
    vscode.window.showTextDocument(doc);
}
async function scaffoldJob() {
    const jobName = await vscode.window.showInputBox({
        prompt: "Enter the name of the job",
        placeHolder: "EmailJob",
    });
    if (!jobName) {
        return; // User cancelled
    }
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage("No workspace folder open");
        return;
    }
    const rootPath = workspaceFolders[0].uri.fsPath;
    const jobPath = path.join(rootPath, "App/Jobs", `${convertToPascalCase(jobName)}.ts`);
    const jobContent = `import ShouldQueue from "expresswebcorets/lib/Queue/ShouldQueue";

export class ${jobName} extends ShouldQueue {
  constructor() {
    super("${jobName}");
  }
  
  /**
   * Handle method executes job.
   * @return void
   */
  handle<T>(data: T): void {
    // Job implementation here
  }
}`;
    ensureDirectoryExistence(jobPath);
    fs.writeFileSync(jobPath, jobContent);
    vscode.window.showInformationMessage(`Job '${jobName}' created successfully!`);
    const doc = await vscode.workspace.openTextDocument(jobPath);
    vscode.window.showTextDocument(doc);
}
async function scaffoldCommand() {
    const commandName = await vscode.window.showInputBox({
        prompt: "Enter the name of the command",
        placeHolder: "HelloCommand",
    });
    if (!commandName) {
        return; // User cancelled
    }
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage("No workspace folder open");
        return;
    }
    const rootPath = workspaceFolders[0].uri.fsPath;
    const commandPath = path.join(rootPath, "App/Console/Commands", `${convertToPascalCase(commandName)}.ts`);
    const commandContent = `import { Command, CommandArgument } from "maker-console-ts";

export class ${commandName} extends Command {
  /**
   * The name or signature of the console command.
   */
  public signature = "";

  /**
   * Argument name and mode of the console command.
   * name is the name of the argument while mode can be REQUIRED or OPTIONAL
   * Example [{name: "Debug", mode: "REQUIRED"},{name: "Task", mode: "REQUIRED"}]
   */
  public arguments?: CommandArgument = [];

  /**
   * The console command description.
   */
  public description = "";

  /**
   * Execute the console command.
   */
  public fire<T>(data?: T): void {
    // Command implementation here
  }
}`;
    ensureDirectoryExistence(commandPath);
    fs.writeFileSync(commandPath, commandContent);
    vscode.window.showInformationMessage(`Command '${commandName}' created successfully!`);
    const doc = await vscode.workspace.openTextDocument(commandPath);
    vscode.window.showTextDocument(doc);
}
async function scaffoldValidation() {
    const validationName = await vscode.window.showInputBox({
        prompt: "Enter the name of the validation",
        placeHolder: "UserValidation",
    });
    if (!validationName) {
        return; // User cancelled
    }
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage("No workspace folder open");
        return;
    }
    const rootPath = workspaceFolders[0].uri.fsPath;
    const validationPath = path.join(rootPath, "App/Http/Validation", `${convertToPascalCase(validationName)}.ts`);
    const validationContent = `import { FormRequest } from "Elucidate/Validator/FormRequest";

export class ${validationName} extends FormRequest {
  /**
   * Handle data validation.
   * @param {*} data | e.g request body
   */
  public static async validate<T>(data: T) {
    return await FormRequest.make<T>(data, {
      // Validation rules
    });
  }
}`;
    ensureDirectoryExistence(validationPath);
    fs.writeFileSync(validationPath, validationContent);
    vscode.window.showInformationMessage(`Validation '${validationName}' created successfully!`);
    const doc = await vscode.workspace.openTextDocument(validationPath);
    vscode.window.showTextDocument(doc);
}
//# sourceMappingURL=scaffolding.js.map