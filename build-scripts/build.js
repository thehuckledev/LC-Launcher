const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const CONF = "./neutralino.config.json";

const run = (cmd) => execSync(cmd, { stdio: "inherit" });
const exists = (p) => fs.existsSync(p);

function loadConfig() {
    if (!exists(CONF)) {
        console.error("Missing neutralino.config.json");
        process.exit(1);
    };
    const cfg = JSON.parse(fs.readFileSync(CONF, "utf-8"));
    if (!cfg.buildScript) {
        console.error("Missing buildScript in config");
        process.exit(1);
    };
    return cfg;
};

function ensureDependencies() {
    if (!exists("./node_modules/@neutralinojs/neu")) {
        console.log("Installing npm dependencies...");
        run("npm install");
    };

    if (!exists("./bin/neutralino-win_x64.exe")) {
        console.log("Downloading Neutralino binaries...");
        run("npx neu update");
    };
};

function buildBase() {
    console.log("\nBuilding Neutralino app...");
    run(`rm -rf ./dist/`);
    run("npx neu build");
};

function copyIfExists(src, dest) {
    if (exists(src)) run(`cp -r "${src}" "${dest}"`);
};

function copyLibs(src, dest, filterFn) {
    if (!exists(src)) return;

    fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
        const fullSrc = path.join(src, file);
        const fullDest = path.join(dest, file);

        if (fs.statSync(fullSrc).isFile() && filterFn(file)) fs.copyFileSync(fullSrc, fullDest);
    };
};

function buildLinux(cfg) {
    const archList = cfg.buildScript.linux.architecture;
    const binary = cfg.cli.binaryName;
    const appName = cfg.buildScript.linux.appName;

    for (const arch of archList) {
        const outDir = `./dist/linux_${arch}/${appName}`;
        const exe = `./dist/${binary}/${binary}-linux_${arch}`;

        if (!exists(exe)) {
            console.error(`Missing binary: ${exe}`);
            process.exit(1);
        };

        fs.mkdirSync(outDir, { recursive: true });

        console.log(`Building Linux (${arch})...`);

        run(`cp "${exe}" "${outDir}/"`);
        run(`cp "./dist/${binary}/resources.neu" "${outDir}/"`);

        copyIfExists(`./dist/${binary}/extensions`, outDir);
        copyLibs(`./libs`, path.join(outDir, "libs"), (f) => f.endsWith("linux"));

        const tarName = `./dist/${appName}-linux-${arch}.tar.gz`;
        run(`tar -cJf "${tarName}" -C ./dist/linux_${arch} "${appName}"`);

        console.log(`Created ${tarName}`);
    };
};

function buildMac(cfg) {
    const archList = cfg.buildScript.mac.architecture;
    const binary = cfg.cli.binaryName;
    const appName = cfg.buildScript.mac.appName;

    for (const arch of archList) {
        const appDir = `./dist/mac_${arch}/${appName}.app`;
        const exe = `./dist/${binary}/${binary}-mac_${arch}`;

        if (!exists(exe)) {
            console.error(`Missing binary: ${exe}`);
            process.exit(1);
        };

        console.log(`Building macOS (${arch})...`);

        fs.mkdirSync(appDir, { recursive: true });

        run(`cp -r ./build-scripts/_app_scaffolds/mac/myapp.app/* "${appDir}/"`);

        run(`cp "${exe}" "${appDir}/Contents/MacOS/main"`);
        run(`chmod 755 "${appDir}/Contents/MacOS/main"`);

        run(`cp "./dist/${binary}/resources.neu" "${appDir}/Contents/Resources/"`);

        copyIfExists(`./dist/${binary}/extensions`, `${appDir}/Contents/Resources/`);
        copyLibs(`./libs`, `${appDir}/Contents/Resources/libs/`, (f) => f.endsWith("osx"));

        const zipName = `./dist/${appName}-mac-${arch}.zip`;
        run(`cd ./dist && zip -9 -rq "${path.basename(zipName)}" "mac_${arch}"`);

        console.log(`Created ${zipName}`);
    };
};

function buildWin(cfg) {
    const archList = cfg.buildScript.win.architecture;
    const binary = cfg.cli.binaryName;
    let appName = cfg.buildScript.win.appName;

    if (!appName.endsWith(".exe")) appName += ".exe";

    for (const arch of archList) {
        const outDir = `./dist/win_${arch}`;
        const exe = `./dist/${binary}/${binary}-win_${arch}.exe`;

        if (!exists(exe)) {
            console.error(`Missing binary: ${exe}`);
            process.exit(1);
        }

        console.log(`Building Windows (${arch})...`);

        fs.mkdirSync(outDir, { recursive: true });

        run(`cp "${exe}" "${outDir}/${appName}"`);
        run(`cp "./dist/${binary}/resources.neu" "${outDir}/"`);

        copyIfExists(`./dist/${binary}/extensions`, outDir);
        copyLibs(`./libs`, path.join(outDir, "libs"), (f) => f.endsWith(".exe"));

        const zipName = `./dist/${appName.replace(".exe", "")}-win-${arch}.zip`;
        run(`cd ./dist && zip -9 -rq "${path.basename(zipName)}" "win_${arch}"`);

        console.log(`Created ${zipName}`);
    };
};

console.log("Building for all platforms...");

const cfg = loadConfig();

ensureDependencies();
buildBase();
buildLinux(cfg);
buildMac(cfg);
buildWin(cfg);

console.log("\nAll platforms built.\n");