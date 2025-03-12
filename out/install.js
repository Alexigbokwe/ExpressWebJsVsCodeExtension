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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function ensureDirectories() {
    const directoriesToCreate = ["snippets"];
    directoriesToCreate.forEach((dir) => {
        const dirPath = path.join(__dirname, "..", dir);
        if (!fs.existsSync(dirPath)) {
            console.log(`Creating directory: ${dir}`);
            fs.mkdirSync(dirPath, { recursive: true });
        }
    });
}
function ensureSnippetsFile() {
    const snippetsPath = path.join(__dirname, "..", "snippets", "expresswebjs.json");
    if (!fs.existsSync(snippetsPath)) {
        console.log("Creating initial snippets file");
        // Default snippets content
        const snippetsContent = {
            "ExpressWebJs App": {
                prefix: "ewjs-app",
                body: ["const { App } = require('expresswebjs');", "const app = new App();", "", "// Start the server", "app.startApp();"],
                description: "Create a new ExpressWebJs app",
            },
            // Add more default snippets as needed
        };
        fs.writeFileSync(snippetsPath, JSON.stringify(snippetsContent, null, 2));
    }
}
console.log("Running ExpressWebJs extension post-install setup...");
try {
    ensureDirectories();
    ensureSnippetsFile();
    console.log("Post-install setup completed successfully!");
}
catch (error) {
    console.error("Error during post-install setup:", error);
    process.exit(1);
}
//# sourceMappingURL=install.js.map