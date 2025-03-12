import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";

function ensureDirectories(): void {
  const directoriesToCreate = ["snippets"];

  directoriesToCreate.forEach((dir) => {
    const dirPath = path.join(__dirname, "..", dir);
    if (!fs.existsSync(dirPath)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
}

function ensureSnippetsFile(): void {
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
} catch (error) {
  console.error("Error during post-install setup:", error);
  process.exit(1);
}
