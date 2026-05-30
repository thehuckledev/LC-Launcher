const fs = require("fs");
const path = require("path");
const child_process = require("child_process");

const CONF = "./neutralino.config.json";
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

function toggleTransparency(on) {
    const cfg = JSON.parse(fs.readFileSync(CONF, "utf-8"));

    if (on) cfg.modes.window.transparent = true;
    else cfg.modes.window.transparent = false;

    fs.writeFileSync(CONF, JSON.stringify(cfg, null, 4));
};

if (!fs.existsSync(path.join(cwd, "node_modules/@neutralinojs/neu"))) {
    console.log("\nInstalling Node Modules...");
    child_process.execSync("npm i", execOptions);
};

if (!fs.existsSync(path.join(cwd, "bin/neutralino-win_x64.exe"))) {
    console.log("\nDownloading Neutralino Binaries...");
    child_process.execSync("npx neu update", execOptions);
};

/*try {
    child_process.execSync("bun --version", { stdio: "ignore" });
    child_process.execSync("bun run main.js", {
        ...execOptions,
        cwd: path.join(cwd, "src-lib")
    });
} catch (e) {
    console.log("\nBun is not installed, LC Lib will not be running");
};*/

if (process.platform === "win32") toggleTransparency(false);
else toggleTransparency(true);

if (process.platform === "linux") child_process.execSync("WEBKIT_DISABLE_COMPOSITING_MODE=1 npx neu run", execOptions);
else if (process.platform === "win32" && process.arch === "arm64") child_process.execSync("npx neu run --arch=x64", execOptions);
else child_process.execSync("npx neu run", execOptions);

if (process.platform === "win32") toggleTransparency(true);