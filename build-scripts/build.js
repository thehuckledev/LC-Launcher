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

function toggleTransparency(on) {
    const cfg = JSON.parse(fs.readFileSync(CONF, "utf-8"));

    if (on) {
        cfg.modes.window.transparent = true;
        cfg.modes.window.borderless = true;
    } else {
        cfg.modes.window.transparent = false;
        cfg.modes.window.borderless = false;
    };

    fs.writeFileSync(CONF, JSON.stringify(cfg, null, 4));
};

function togglePortableMode(on) {
    const cfg = JSON.parse(fs.readFileSync(CONF, "utf-8"));

    if (on) cfg.globalVariables.PORTABLE = true;
    else cfg.globalVariables.PORTABLE = false;

    fs.writeFileSync(CONF, JSON.stringify(cfg, null, 4));
};

function patchConfig(on) {
    const cfg = JSON.parse(fs.readFileSync(CONF, "utf-8"));

    if (on) {
        const isDebug = process.argv.includes("--debug");
        if(isDebug) cfg.modes.window.enableInspector = true;
        else cfg.modes.window.enableInspector = false;

        if(isDebug) cfg.logging.enabled = true;
        if(isDebug) cfg.logging.writeToLogFile = true;
        cfg.tokenSecurity = "one-time";
    } else {
        cfg.modes.window.enableInspector = true;
        cfg.logging.enabled = false;
        cfg.logging.writeToLogFile = false;
        cfg.tokenSecurity = "none";
    };

    fs.writeFileSync(CONF, JSON.stringify(cfg, null, 4));
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

function buildBase(wipe = true) {
    console.log("\nBuilding Neutralino app...");
    if (!!wipe) run(`rm -rf ./dist/`);
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

function buildLinux(cfg, portable) {
    const archList = cfg.buildScript.linux.architecture;
    const binary = cfg.cli.binaryName;
    const appName = cfg.buildScript.linux.appName;
    const safeAppName = appName.replaceAll(" ", "-");

    for (const arch of archList) {
        const outDir = `./dist/linux_${arch}${!!portable ? "_portable" : ""}/${safeAppName}`;
        const exe = `./dist/${binary}/${binary}-linux_${arch}`;

        if (!exists(exe)) {
            console.error(`Missing binary: ${exe}`);
            process.exit(1);
        };

        fs.mkdirSync(`${outDir}/usr/bin/`, { recursive: true });

        console.log(`Building Linux (${arch})...`);

        run(`cp "${exe}" "${outDir}/usr/bin/${safeAppName}"`);
        run(`cp "./assets/appimage/icon.png" "${outDir}/.DirIcon"`);
        run(`cp "./assets/appimage/icon.png" "${outDir}/${safeAppName}.png"`);
        run(`cp "./dist/${binary}/resources.neu" "${outDir}/usr/bin/"`);

        copyIfExists(`./dist/${binary}/extensions`, `${outDir}/usr/bin/`);
        copyLibs(`./libs`, path.join(`${outDir}/usr/bin/`, "libs"), (f) => f.includes("linux") && (f.includes(arch) || f.includes("no-arch")));

        const appRun = `#!/bin/sh

if [ -z "$APPDIR" ]; then
    APPDIR=$(readlink -f "$(dirname "$0")")
fi

# fixes the webkit no window showing up
export WEBKIT_DISABLE_DMABUF_RENDERER=1

# stops double window titlebar
if [ "$XDG_SESSION_TYPE" = "wayland" ]; then
    export GDK_BACKEND=x11
fi

# expose internal bundled gstreamer plugins
if [ -d "$APPDIR/usr/lib/gstreamer-1.0" ]; then
    export GST_PLUGIN_SYSTEM_PATH=""
    export GST_PLUGIN_PATH="$APPDIR/usr/lib/gstreamer-1.0"
fi

exec $APPDIR/usr/bin/${safeAppName} "$@"`;
        fs.writeFileSync(`${outDir}/AppRun`, appRun, { mode: 0o755 });

        const desktopFile = `[Desktop Entry]
Version=1.0
Name=${appName}
Comment=Multi-platform launcher for LCE forks
Exec=${safeAppName}
Icon=${safeAppName}
Type=Application
Categories=Game;Utility;
Terminal=false
StartupNotify=true
Keywords=game;launcher;legacy;community;`;
        fs.writeFileSync(`${outDir}/${safeAppName}.desktop`, desktopFile);

        const tarName = `./dist/__${safeAppName}${!!portable ? "-portable" : ""}-linux-${arch}x.tar.gz`;
        const envPrefix = process.platform === 'darwin' ? 'export COPYFILE_DISABLE=1 && ' : '';
        run(`${envPrefix}tar --exclude="._*" --exclude=".DS_Store" --exclude="__MACOSX" -cJf "${tarName}" -C ./dist/linux_${arch}${!!portable ? "_portable" : ""} "${safeAppName}"`);

        if (process.platform === "linux" && process.argv.length > 2) {
            console.log(`Creating AppImage for ${arch}...`);
            const targetArch = arch === 'arm64' ? 'aarch64' : arch;

            const hasLinuxDeploy = !!execSync("which linuxdeploy 2>/dev/null || true").toString().trim();
            if (hasLinuxDeploy) {
                run(`ARCH=${targetArch} LINUXDEPLOY_PLUGINS="gstreamer" linuxdeploy --appdir="${outDir}" --executable="${outDir}/usr/bin/${safeAppName}" --output appimage`);
                run(`mv ./*.AppImage "./dist/${safeAppName}${!!portable ? "-portable" : ""}-linux-${arch}.AppImage" 2>/dev/null || true`);
            } else {
                run(`ARCH=${targetArch} appimagetool "${outDir}" "./dist/${safeAppName}${!!portable ? "-portable" : ""}-linux-${arch}.AppImage"`);
            };
        };

        console.log(`Created ${tarName}`);
    };
};

function buildMac(cfg, portable) {
    const archList = cfg.buildScript.mac.architecture;
    const binary = cfg.cli.binaryName;
    const appName = cfg.buildScript.mac.appName;
    const safeAppName = appName.replaceAll(" ", "-");

    const appVersion = cfg.version;
    const appMinOs = cfg.buildScript.mac.minimumOS;
    const appId = cfg.buildScript.mac.appIdentifier;
    const appBundle = cfg.buildScript.mac.appBundleName;
    const appCredits = cfg.buildScript.mac.appCredits;

    for (const arch of archList) {
        const appDir = `./dist/mac_${arch}${!!portable ? "_portable" : ""}/${appName}.app`;
        const exe = `./dist/${binary}/${binary}-mac_${arch}`;

        if (!exists(exe)) {
            console.error(`Missing binary: ${exe}`);
            process.exit(1);
        };

        console.log(`Building macOS (${arch})...`);

        fs.mkdirSync(appDir, { recursive: true });

        run(`cp -r ./build-scripts/_app_scaffolds/mac/myapp.app/* "${appDir}/"`);

        const plistPath = path.join(appDir, "Contents/Info.plist");
        if (exists(plistPath)) {
            let plistContent = fs.readFileSync(plistPath, "utf-8");
            plistContent = plistContent
                .replace(/{APP_NAME}/g, appName)
                .replace(/{APP_BUNDLE}/g, appBundle)
                .replace(/{APP_ID}/g, appId)
                .replace(/{APP_VERSION}/g, appVersion)
                .replace(/{APP_MIN_OS}/g, appMinOs)
                .replace(/{APP_CREDITS}/g, appCredits);

            fs.writeFileSync(plistPath, plistContent);
        };

        run(`cp "${exe}" "${appDir}/Contents/MacOS/main"`);
        run(`chmod 755 "${appDir}/Contents/MacOS/main"`);

        run(`cp "./dist/${binary}/resources.neu" "${appDir}/Contents/Resources/"`);

        const appIcon = cfg.buildScript.mac.appIcon;
        if (appIcon && exists(appIcon)) run(`cp "${appIcon}" "${appDir}/Contents/Resources/"`);

        copyIfExists(`./dist/${binary}/extensions`, `${appDir}/Contents/Resources/`);
        copyLibs(`./libs`, `${appDir}/Contents/Resources/libs/`, (f) => f.includes("osx") && (f.includes(arch) || f.includes("no-arch")));

        const zipParent = path.join("./dist", `mac_${arch}${!!portable ? "_portable" : ""}`);
        const zipName = `./dist/${!portable ? "__" : ""}${safeAppName}${!!portable ? "-portable" : ""}-mac-${arch}.zip`;
        if (process.platform === "win32")
            run(`powershell -Command "Compress-Archive -Path '${zipParent}\\${appName}.app' -DestinationPath '${zipName}' -Force"`);
        else
            run(`cd "./dist/mac_${arch}${!!portable ? "_portable" : ""}" && zip -9 -rq "../${path.basename(zipName)}" "${appName}.app" -x "**/._*" -x "**/.DS_Store" -x "**/__MACOSX"`);

        if (process.platform === "darwin" && process.argv.length > 2 && !portable) {
            console.log("Creating DMG...");
            run(`create-dmg \
                    --volname "${appName}" \
                    --volicon "./assets/dmg/dmg-icon.icns" \
                    --background "./assets/dmg/dmg-background.png" \
                    --window-pos 300 100 \
                    --window-size 800 505 \
                    --icon-size 100 \
                    --icon "${appName}.app" 200 190 \
                    --hide-extension "${appName}.app" \
                    --app-drop-link 600 185 \
                    "./dist/${safeAppName}-mac-${arch}${!!portable ? "-portable" : ""}.dmg" \
                    "${appDir}"`);
        };

        console.log(`Created ${zipName}`);
    };
};

function buildWin(cfg, portable) {
    const archList = cfg.buildScript.win.architecture;
    const binary = cfg.cli.binaryName;
    let appName = cfg.buildScript.win.appName;

    if (!appName.endsWith(".exe")) appName += ".exe";

    const safeAppName = appName.replaceAll(" ", "-");

    for (const arch of archList) {
        const outDir = `./dist/win_${arch}${!!portable ? "_portable" : ""}`;
        const exe = `./dist/${binary}/${binary}-win_${arch}.exe`;

        if (!exists(exe)) {
            console.error(`Missing binary: ${exe}`);
            process.exit(1);
        };

        console.log(`Building Windows (${arch})...`);

        fs.mkdirSync(outDir, { recursive: true });

        run(`cp "${exe}" "${outDir}/${appName}"`);
        if (!portable) run(`cp "./assets/nsis/icon.ico" "${outDir}/icon.ico"`);
        run(`cp "./dist/${binary}/resources.neu" "${outDir}/"`);

        copyIfExists(`./dist/${binary}/extensions`, outDir);
        copyLibs(`./libs`, path.join(outDir, "libs"), (f) => f.includes("windows") && (f.includes(arch) || f.includes("no-arch")));

        const zipParent = path.join("./dist", `win_${arch}${!!portable ? "_portable" : ""}`);
        const zipName = `./dist/${!portable ? "__" : ""}${safeAppName.replace(".exe", "")}${!!portable ? "-portable" : ""}-win-${arch}.zip`;
        if (process.platform === "win32")
            run(`powershell -Command "Compress-Archive -Path '${zipParent}\\*' -DestinationPath '${zipName}' -Force"`);
        else
            run(`cd ./dist && zip -9 -rq "${path.basename(zipName)}" "win_${arch}" -x "**/._*" -x "**/.DS_Store" -x "**/__MACOSX"`);

        if (process.platform === "win32" && process.argv.length > 2 && !portable) {
            console.log("Creating Windows Installer...");
            run(`"C:\\Program Files (x86)\\NSIS\\makensis.exe" ./build-scripts/installer.nsi`);
        };
        
        console.log(`Created ${zipName}`);
    };
};

const targetArg = process.argv[2];

console.log(`Building for ${targetArg ? targetArg : 'all platforms'}...`);

const cfg = loadConfig();
ensureDependencies();

const shouldBuild = (platform) => !targetArg || platform.includes(targetArg);

function buildApp(portable) {
    try {
        patchConfig(true);
        if (!!portable) togglePortableMode(true);

        if (shouldBuild('linux') || shouldBuild('darwin')) buildBase(!portable);
        if (shouldBuild('linux')) buildLinux(cfg, portable);
        if (shouldBuild('darwin')) buildMac(cfg, portable);

        if (shouldBuild('windows')) {
            toggleTransparency(false);
            buildBase(false);
            buildWin(cfg, portable);
            toggleTransparency(true);
        };

        togglePortableMode(false);
        patchConfig(false);
    } catch(e) {
        console.error(e);

        toggleTransparency(true);
        togglePortableMode(false);
        patchConfig(false);
    };
};

buildApp(false);
buildApp(true);

console.log("\nAll platforms built.\n");