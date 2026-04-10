const fs = require("fs");
const path = require("path");
const child_process = require("child_process");

const cwd = path.join(__dirname, "../");
const execOptions = {
    cwd: cwd,
    stdio: "inherit",
    env: { 
        ...process.env, 
        WEBKIT_DISABLE_COMPOSITING_MODE: "1" 
    },
    shell: true
};

if (!fs.existsSync(path.join(cwd, "node_modules/@neutralinojs/neu"))) {
    console.log("\nInstalling Node Modules...");
    child_process.execSync("npm i", execOptions);
};

if (!fs.existsSync(path.join(cwd, "bin/neutralino-win_x64.exe"))) {
    console.log("\Downloading Neutralino Binaries...");
    child_process.execSync("npx neu update", execOptions);
};

child_process.execSync("WEBKIT_DISABLE_COMPOSITING_MODE=1 npx neu run", execOptions);