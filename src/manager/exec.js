import Neutralino from "@neutralinojs/lib";
import { showToast } from "../components/Toast";
import { getSetting } from "../utils/settingsManager.js";
import Download from "../utils/download.js";
import Unzip from "../utils/unzip.js";

import charPng from '../assets/misc/char.png';

export class Exec {
    constructor(manager) {
        this.manager = manager;
        this.userStopped = false;
    };

    async findProtonPath() {
        const home = await Neutralino.os.getEnv('HOME');
        const possiblePaths = [
            // Steam
            `${home}/.steam/steam/steamapps/common`,
            `${home}/.local/share/Steam/steamapps/common`,
            
            // Proton GE
            `${home}/.steam/root/compatibilitytools.d`,
            `${home}/.steam/steam/compatibilitytools.d`,
            `${home}/.local/share/Steam/compatibilitytools.d`,

            // Flatpak Steam
            `${home}/.var/app/com.valvesoftware.Steam/data/Steam/steamapps/common`,
            `${home}/.var/app/com.valvesoftware.Steam/data/Steam/compatibilitytools.d`
        ];

        let pathsFound = [];
        for (const possiblePath of possiblePaths) {
            try {
                const entries = await Neutralino.filesystem.readDirectory(possiblePath);
                for (const entry of entries) {
                    if (entry.type !== 'DIRECTORY') continue;
                    
                    const name = entry.entry;
                    if (name.startsWith('Proton') || name.includes('GE-Proton')) {
                        const fullPath = await Neutralino.filesystem.getJoinedPath(possiblePath, name, "proton");
                        try {
                            await Neutralino.filesystem.getStats(fullPath);
                            pathsFound.push({ name, path: fullPath });
                        } catch(e) {};
                    };
                };
            } catch (e) {};
        };

        if (pathsFound.length === 0) return null;
        pathsFound.sort((a, b) => {
            if (a.name.includes('Experimental')) return -1;
            if (b.name.includes('Experimental')) return 1;
            return b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' });
        });

        return pathsFound[0].path;
    };

    async backupPreserved(instancePath) {
        const backupDir = await Neutralino.filesystem.getJoinedPath(instancePath, "backup");
        await this.manager.utils.ensureDir(backupDir);

        for (const rel of this.manager.preserveList) {
            const src = await Neutralino.filesystem.getJoinedPath(instancePath, "content", rel);
            const dst = await Neutralino.filesystem.getJoinedPath(backupDir, rel);

            try {
                const stats = await Neutralino.filesystem.getStats(src);
                if (stats.type === 'DIRECTORY') {
                    await this.manager.utils.ensureDir(dst);
                } else {
                    const parentDir = dst.substring(0, dst.lastIndexOf("/"));
                    await this.manager.utils.ensureDir(parentDir);
                };

                await Neutralino.filesystem.copy(src, dst, {
                    recursive: true,
                    overwrite: true
                });
            } catch(e) {
                console.error(e);
            };
        };
    };

    async restorePreserved(instancePath) {
        const backupDir = await Neutralino.filesystem.getJoinedPath(instancePath, "backup");

        for (const rel of this.manager.preserveList) {
            const src = await Neutralino.filesystem.getJoinedPath(backupDir, rel);
            const dst = await Neutralino.filesystem.getJoinedPath(instancePath, "content", rel);

            try {
                const stats = await Neutralino.filesystem.getStats(src);
                if (stats.type === 'DIRECTORY') {
                    await this.manager.utils.ensureDir(dst);
                } else {
                    const parentDir = dst.substring(0, dst.lastIndexOf("/"));
                    await this.manager.utils.ensureDir(parentDir);
                };

                await Neutralino.filesystem.copy(src, dst, {
                    recursive: true,
                    overwrite: true
                });
            } catch {};
        };

        // cleanup
        await Neutralino.filesystem.remove(backupDir);
    };

    async installInstance(instance, isUpdate = false) {
        try {
            if (!navigator.onLine) return showToast("Error: You must be online to install an instance");

            const release = await this.manager.remotes.get(instance, instance.tag);
            if (!release) return showToast("Error: Release not found");

            if (!release.assets || release.assets.length === 0)
                return showToast("Error: No assets found in this release");

            const asset = instance.target
                ? release.assets.find(a => a.name === instance.target)
                : release.assets[0];
            if (!asset) return showToast("Error: Required asset not found in release");

            const instancePath = await Neutralino.filesystem.getJoinedPath(this.manager.instancesDir, instance.id);
            const zipPath = await Neutralino.filesystem.getJoinedPath(instancePath, instance.target);

            await this.manager.utils.ensureDir(await Neutralino.filesystem.getJoinedPath(instancePath, 'content'));

            console.log("Downloading build...");
            const download = new Download(asset.browser_download_url, { label: `Downloading instance${isUpdate ? ' update' : ''}...` });
            try {
                await download.start(zipPath);
            } catch(e) {
                console.error(e);
                return showToast("Error: Asset download failed");
            };

            console.log("Extracting build...");
            await this.backupPreserved(instancePath);
            const contentDir = `${instancePath}/content`;
            const unzipContent = new Unzip(zipPath, contentDir, { label: `Extracting instance${isUpdate ? ' update' : ''}...` });
            try {
                await unzipContent.start();

                // unlock files before moving
                if (NL_OS === "Windows")
                    await Neutralino.os.execCommand(`powershell -NoProfile -Command "Get-ChildItem -Path '${contentDir}' -Recurse | Unblock-File"`);

                // fix some zips having folders but some using root
                const entries = await Neutralino.filesystem.readDirectory(contentDir);
                if (entries.length === 1 && entries[0].type === 'DIRECTORY') {
                    const rootDirName = entries[0].entry;
                    const rootDirPath = await Neutralino.filesystem.getJoinedPath(contentDir, rootDirName);
                    
                    const rootFiles = await Neutralino.filesystem.readDirectory(rootDirPath);
                    for (const file of rootFiles) {
                        const srcPath = await Neutralino.filesystem.getJoinedPath(rootDirPath, file.entry);
                        const destPath = await Neutralino.filesystem.getJoinedPath(contentDir, file.entry);
                        
                        await Neutralino.filesystem.move(srcPath, destPath);
                    };
                    await Neutralino.filesystem.remove(rootDirPath);
                };
            } catch(e) {
                console.error(e);
                try { // remove zip
                    await Neutralino.filesystem.remove(`${this.manager.instancesDir}/${instance.id}/${instance.target}`);
                } catch { }
                return showToast("Error: Asset unzip failed");
            };
            await this.restorePreserved(instancePath);

            instance.assetId = asset.id;
            instance.installed = true;

            await this.manager.utils.writeJSON(`${instancePath}/instance.json`, instance);
            console.log("Instance installed");
            showToast(`Instance${isUpdate ? ' update' : ''} installed`);
        } catch (err) {
            console.error(err);
            showToast(`Error: ${err.message}`);
        } finally {
            try { // remove zip
                await Neutralino.filesystem.remove(`${this.manager.instancesDir}/${instance.id}/${instance.target}`);
            } catch { }
        };
    };

    async needsUpdate(instance) {
        try {
            const release = await this.manager.remotes.get(instance, instance.tag);
            if (!release) return false;

            const asset = instance.target
                ? release.assets.find(a => a.name === instance.target)
                : release.assets[0];
            return asset.id !== instance.assetId;
        } catch(e) {
            console.error(e);
            return false;
        };
    };

    async writeSkin(instanceId, dataURI) {
        try {
            const baseDir = `${this.manager.instancesDir}/${instanceId}/content`;
            const filePath = `${baseDir}/Common/res/mob/char.png`;

            if (!dataURI) {
                await this.manager.utils.ensureDir(`${baseDir}/Common/res/mob`);
                await Neutralino.filesystem.remove(filePath).catch((e)=>{});
                await Neutralino.resources.extractFile(`/public${charPng}`, filePath);
                return console.log("Skin written to:", filePath);
            };
            
            const response = await fetch(dataURI, {
                cache: "no-store"
            });
            const arrayBuffer = await response.arrayBuffer();

            await this.manager.utils.ensureDir(`${baseDir}/Common/res/mob`);
            await Neutralino.filesystem.writeBinaryFile(filePath, arrayBuffer);
            console.log("Skin written to:", filePath);
        } catch (err) {
            console.error("Failed to write skin:", err);
            return showToast("Error: Skin couldn't be written to instance");
        };
    };

    parseWINELog(line) {
        if (!line || typeof line !== "string") return;

        const msg = line.trim();
        const regex = /^(?:([\d.]+):)?(?:([a-f0-9]{4}):)?([a-z]+):([^:]+?):(?:([^:\s]+)(?:\s|:))?(.*)$/i;
        const match = regex.exec(msg);
        if (!match) return { type: "text", message: msg };

        const [, timestamp, pid, level, channel, func, message] = match;

        const typeMap = {
            err: "error",
            warn: "warn",
            fixme: "fixme",
            trace: "trace"
        };

        let type = typeMap[level?.toLowerCase()] || "text";

        return {
            type,
            timestamp: timestamp || null,
            pid: pid || null,
            channel: channel || null,
            func: func || null,
            message: message?.trim() || ""
        };
    };

    async installRuntimeHelper() {
        const dataDirectory = await getSetting("dataDirectory");
        const runtimeDir = `${dataDirectory}/libraries/runtime`;
        const runtimeTempDir = `${dataDirectory}/libraries/_runtime`;
        let archivePath = null;
        try {
            const prefix = `${dataDirectory}/pfx`;

            let repo = "";
            if (NL_OS === "Darwin") repo = "Gcenx/game-porting-toolkit";
            else if (NL_OS === "Linux") repo = "GloriousEggroll/proton-ge-custom";

            showToast(`Fetching latest runtime...`);

            let apiResponse = await Neutralino.os.execCommand(`curl -H "Accept: application/vnd.github+json" -H "User-Agent: LC-Launcher" -H "X-GitHub-Api-Version: 2026-03-10" -s https://api.github.com/repos/${repo}/releases/latest`);
            let releaseData = JSON.parse(apiResponse.stdOut);

            let asset = releaseData.assets.find(a => a.name.endsWith('.tar.xz') || a.name.endsWith('.tar.gz'));
            if (!asset) throw new Error("No archive found in runtime release");

            const downloadUrl = asset.browser_download_url;
            archivePath = `${dataDirectory}/libraries/${asset.name}`;

            await Neutralino.filesystem.createDirectory(runtimeDir).catch(()=>{});
            await Neutralino.filesystem.createDirectory(runtimeTempDir).catch(()=>{});

            const runtimeDownload = new Download(downloadUrl, { label: `Downloading Runtime...` });
            await runtimeDownload.start(archivePath);

            const runtimeUnzip = new Unzip(archivePath, runtimeTempDir, { label: "Extracting Runtime..." });
            await runtimeUnzip.start();

            if (NL_OS === "Darwin") {
                const internalRuntimeSource = `${runtimeTempDir}/Game Porting Toolkit.app/Contents/Resources/wine`;
                await Neutralino.os.execCommand(`cp -R "${internalRuntimeSource}/." "${runtimeDir}"`);
                await Neutralino.os.execCommand(`xattr -rd com.apple.quarantine "${runtimeDir}"`);
            } else {
                const protonDirs = await Neutralino.filesystem.readDirectory(runtimeTempDir);
                if (protonDirs.length < 1) throw new Error("No runtime found after download");
                const protonDir = protonDirs[0].entry;
                const internalRuntimeSource = `${runtimeTempDir}/${protonDir}/files`;
                await Neutralino.os.execCommand(`cp -R "${internalRuntimeSource}/." "${runtimeDir}"`);
            };
            await Neutralino.filesystem.remove(archivePath).catch(()=>{});
            await Neutralino.filesystem.remove(runtimeTempDir).catch(()=>{});

            showToast('Setting up C Drive...');
            await Neutralino.filesystem.createDirectory(prefix).catch(()=>{});

            const wineBin = (NL_OS === "Darwin") ? "wine64" : "wine";
            const winePath = `${runtimeDir}/bin/${wineBin}`;

            let envVars = `WINEPREFIX="${prefix}" WINEDEBUG=-all WINEESYNC=1 `;
            if (NL_OS === "Darwin") envVars += `MTL_HUD_ENABLED=0 `;
            else envVars += `STEAM_COMPAT_CLIENT_INSTALL_PATH="~/.steam/steam" STEAM_COMPAT_DATA_PATH="${prefix}" `;

            await Neutralino.os.execCommand(`${envVars} "${winePath}" wineboot --init`);
        } catch (err) {
            console.error("Runtime download failed:", err);
            showToast("Runtime install failed, try manual install");

            await Neutralino.filesystem.remove(runtimeDir).catch(()=>{});
            await Neutralino.filesystem.remove(runtimeTempDir).catch(()=>{});
            if(archivePath !== null) await Neutralino.filesystem.remove(archivePath).catch(()=>{});
        };
    };

    async launch(instanceId, profileId) {
        try {
            window.dispatchEvent(new CustomEvent("execProcessing", { detail: true }));
            await this._launch(instanceId, profileId);
        } catch {} finally {
            window.dispatchEvent(new CustomEvent("execProcessing", { detail: false }));
        };
    };

    async _launch(instanceId, profileId) {
        if (!instanceId) return showToast("You need to create an instance");
        if (!profileId) return showToast("You need to create a profile");

        const instance = await this.manager.instances.get(instanceId);
        if (!instance) return showToast("Error: Instance not found");

        const profile = await this.manager.profiles.get(profileId);
        if (!profile) return showToast("Error: Profile not found");

        if (!instance.installed) return await this.installInstance(instance);

        if (navigator.onLine === true && await this.needsUpdate(instance)) {
            let shouldDo = await Neutralino.os
                        .showMessageBox('Instance Update',
                                        'Do you want to update your current instance?',
                                        'YES_NO', 'WARNING');
            if(shouldDo == 'YES') {
                console.log("Updating instance...");
                await this.installInstance(instance, true);
            };
        };

        // do proton runtime check for steam os
        let hasProton = false;
        if (NL_OS === "Linux") {
            const protonPath = await this.findProtonPath();
            if (protonPath) hasProton = true;
        };

        // check for runtime
        if (NL_OS === "Linux" || NL_OS === "Darwin") {
            if (instance.compatibilityLayer === "RUNTIME") {
                const dataDir = await getSetting("dataDirectory");
                const runtimePath = `${dataDir}/libraries/runtime`;

                try {
                    await Neutralino.filesystem.getStats(`${runtimePath}/bin/${NL_OS === "Darwin" ? 'wine64' : 'wine'}`);
                } catch {
                    if (!hasProton) {
                        let shouldDo = await Neutralino.os
                                                .showMessageBox('LC Launcher Runtime',
                                                    'This instance requires the runtime as its compatibility layer. Do you want to install the runtime?',
                                                    'YES_NO', 'INFO');
                        if(shouldDo == 'YES') {
                            console.log("Installing runtime...");
                            await this.installRuntimeHelper();
                        } else return showToast("Launch stopped due to runtime not being installed");
                    };
                };
            };
        };

        // save skin from datauri
        await this.writeSkin(instanceId, profile.skin);

        const cwd = await Neutralino.filesystem.getJoinedPath(this.manager.instancesDir, instanceId, "content");
        const execPath = await Neutralino.filesystem.getJoinedPath(cwd, instance.exec);

        // write uid
        const uidPath = await Neutralino.filesystem.getJoinedPath(cwd, "uid.dat");
        await Neutralino.filesystem.writeFile(uidPath, `${profile.uid}\n`);
        console.log("UID written to:", uidPath, profile.uid);

        // write servers.txt
        const servers = await this.manager.servers.list(instanceId);

        const content = servers
            .map(s => `${s.ip}\n${s.port}\n${s.name}`)
            .join("\n") + (servers.length ? "\n" : "");
        const serversPath = await Neutralino.filesystem.getJoinedPath(
            this.manager.instancesDir,
            instanceId,
            "content",
            "servers.txt"
        );

        await Neutralino.filesystem.writeFile(serversPath, content);
        console.log("Servers written to:", serversPath, content);


        try {
            await Neutralino.filesystem.getStats(execPath);
        } catch {
            return showToast("Error: Executable missing");
        };

        if (NL_OS === "Linux" || NL_OS === "Darwin") {
            try {
                await Neutralino.os.execCommand(`chmod +x "${execPath}"`);
            } catch { };
        };

        const args = [];

        if (profile.username) args.push("-name", profile.username);
        if (instance.fullscreen === true) args.push("-fullscreen");

        if (instance.ip) args.push("-ip", instance.ip);
        if (instance.port) args.push("-port", instance.port);

        const joinedArgs = args.map(a => `"${a}"`).join(" ");
        let cmd = `"${execPath}" ${joinedArgs}`;

        const dataDir = await getSetting("dataDirectory");
        const prefix = `${dataDir}/pfx`;
        let wineServerBin = "wineserver";

        // compatibility layers
        if (NL_OS === "Linux" || NL_OS === "Darwin") {
            const compat = instance.compatibilityLayer;
            const runtimePath = `${dataDir}/libraries/runtime`;
            const prefix = `${dataDir}/pfx`;
            
            let bin = "";

            if (compat === "RUNTIME") {
                if (NL_OS === "Darwin") { // WINE RUNTIME
                    try {
                        await Neutralino.filesystem.getStats(`${runtimePath}/bin/wine64`);
                        const winePath = `${runtimePath}/bin/wine64`;
                        wineServerBin = `${runtimePath}/bin/wineserver`;
                        
                        const env = `WINEPREFIX="${prefix}" WINEESYNC=1 MTL_HUD_ENABLED=0 WINEDLLOVERRIDES="d3d11=n,b;dxgi=n,b"`;
                        bin = `${env} "${winePath}"`;
                        
                        try {
                            await Neutralino.filesystem.getStats(prefix);
                        } catch {
                            showToast('Setting up C Drive...');
                            await Neutralino.os.execCommand(`${env} "${winePath}" wineboot --init`);
                        };
                    } catch {
                        bin = `WINEPREFIX="${prefix}" ${compat.toLowerCase()}`;
                    };
                } else if (NL_OS === "Linux") { // PROTON GE RUNTIME
                    const protonPath = await this.findProtonPath();
                    const env = `WINEPREFIX="${prefix}" WINEESYNC=1 STEAM_COMPAT_CLIENT_INSTALL_PATH="~/.steam/steam" STEAM_COMPAT_DATA_PATH="${prefix}"`;
                    
                    if (protonPath) bin = `${env} "${protonPath}" run`;
                    else {
                        try {
                            await Neutralino.filesystem.getStats(`${runtimePath}/bin/wine`);
                            const winePath = `${runtimePath}/bin/wine`;
                            wineServerBin = `${runtimePath}/bin/wineserver`;
                            bin = `${env} "${winePath}"`;
                        } catch (e) {
                            bin = `${env} proton run`;
                        };
                    };

                    try {
                        await Neutralino.filesystem.getStats(prefix);
                    } catch {
                        showToast('Setting up C Drive...');
                        const initCmd = protonPath ? `"${protonPath}" run wineboot --init` : `proton run wineboot --init`;
                        await Neutralino.os.execCommand(`${env} ${initCmd}`);
                    };
                    // below is a runtime first priority version
                    /*try {
                        await Neutralino.filesystem.getStats(`${runtimePath}/bin/wine`);
                        const winePath = `${runtimePath}/bin/wine`;
                        wineServerBin = `${runtimePath}/bin/wineserver`;

                        const env = `WINEPREFIX="${prefix}" WINEESYNC=1 STEAM_COMPAT_CLIENT_INSTALL_PATH="~/.steam/steam" STEAM_COMPAT_DATA_PATH="${prefix}"`;
                        bin = `${env} "${winePath}"`;

                        try {
                            await Neutralino.filesystem.getStats(prefix);
                        } catch {
                            showToast('Setting up C Drive...');
                            await Neutralino.os.execCommand(`${env} "${winePath}" wineboot --init`);
                        };
                    } catch (e) {
                        if (!!hasProton) {
                            const protonPath = await this.findProtonPath();
                            const env = `STEAM_COMPAT_CLIENT_INSTALL_PATH="~/.steam/steam" STEAM_COMPAT_DATA_PATH="${prefix}"`;
                            
                            if (protonPath) bin = `${env} "${protonPath}" run`;
                            else bin = `${env} proton run`;
                        }
                        else bin = `STEAM_COMPAT_CLIENT_INSTALL_PATH="~/.steam/steam" STEAM_COMPAT_DATA_PATH="${prefix}" proton run`;
                    };*/
                };
            }

            else if (compat === "WINE" || compat === "WINE64")
                bin = `${compat.toLowerCase()}`;

            else if (compat === "PROTON") {
                const protonPath = await this.findProtonPath();
                const env = `STEAM_COMPAT_CLIENT_INSTALL_PATH="~/.steam/steam" STEAM_COMPAT_DATA_PATH="${prefix}"`;
                
                if (protonPath) bin = `${env} "${protonPath}" run`;
                else bin = `${env} proton run`;
            };

            if (bin !== "") {
                const parts = bin.match(/(?:[^\s"]+|"[^"]*")+/g) || []; // stops quoted spaces from being split
                const actualExecutable = parts.find(p => !p.includes("=") && p !== "run");
                const baseCmd = actualExecutable ? actualExecutable.replace(/"/g, "") : "";
                if (baseCmd.includes("/") || await this.manager.utils.cmdExists(baseCmd)) {
                    const debug = "WINEDEBUG=err+all,warn+d3d,warn+msvcrt,fixme+d3d,fixme+ntdll,+timestamp";
                    cmd = `${instance.customArgs ? `${instance.customArgs} ` : ""}${debug} ${bin} "${execPath}" ${joinedArgs}`;
                } else return showToast(`Error: ${compat} is not installed on your system`);
            };

            if (compat === "DIRECT" && execPath.endsWith(".exe"))
                showToast("You should have a compatibility layer on Linux and MacOS", 1000);
        };

        showToast("Launching instance...", 1000);
        console.log("Launching:", cmd);

        window.dispatchEvent(new CustomEvent("silenceMusic", { detail: true }));
        const isTranslated = instance.compatibilityLayer !== "DIRECT" && (NL_OS === "Linux" || NL_OS === "Darwin");
        const keepLauncherOpen = await getSetting("keepLauncherOpen");
        return new Promise(async (resolve) => {
            this.userStopped = false;
            try {
                if(keepLauncherOpen === false) {
                    if (NL_OS === "Windows") setTimeout(() => { Neutralino.window.hide(); }, 200);
                    else setTimeout(() => { Neutralino.window.hide(); }, 2000);
                };
                
                const startTime = Date.now();
                let crashDetected = false;
                const proc = await Neutralino.os.spawnProcess(cmd, { cwd });
                window.whenQuitting = async (ev) => { // close game also
                    if (!proc?.pid) return;
                    try {
                        console.log("Killing process:", proc.pid);
                        this.userStopped = true;

                        if (NL_OS === "Windows") {
                            await Neutralino.os.execCommand(`taskkill /PID ${proc.pid} /T /F`);
                        } else {
                            try {
                                if (instance.compatibilityLayer === "RUNTIME")
                                    await Neutralino.os.execCommand(`WINEPREFIX="${prefix}" "${wineServerBin}" -k`);
                                else if (instance.compatibilityLayer !== "DIRECT")
                                    await Neutralino.os.execCommand(`"${wineServerBin}" -k`);
                                else
                                    await Neutralino.os.execCommand(`kill -9 -${proc.pid}`);
                            } catch {
                                await Neutralino.os.execCommand(`kill -9 -${proc.pid}`);
                            };
                        };
                    } catch (e) {
                        console.error("Failed to kill process tree:", e);
                    };
                    await new Promise(r => setTimeout(r, 200));
                };
                const handler = async (evt) => {
                    if (proc.id == evt.detail.id) {
                        switch (evt.detail.action) {
                            case 'stdOut': {
                                if(keepLauncherOpen === false) return;

                                const lines = evt.detail.data.split(/\r?\n/);
                                for (const line of lines) {
                                    window.dispatchEvent(new CustomEvent("gameLog", {
                                        detail: { type: "out", from: "DIRECT", message: line }
                                    }));
                                };
                                break;
                            };
                            case 'stdErr': {
                                if(keepLauncherOpen === false) return;

                                let lines = evt.detail.data.split(/\r?\n/);
                                for await (const line of lines) {
                                    let msg = { type: "err", from: "DIRECT", message: line };
                                    if(isTranslated) { // parse wine logs
                                        const parsed = this.parseWINELog(line);
                                        if (!parsed) continue;
                                        parsed.from = "WINE";
                                        msg = parsed;

                                        const lower = parsed.message?.toLowerCase() || "";
                                        const lowerFunc = parsed.func?.toLowerCase() || "";
                                        const containsCrashKeyword = (
                                            lower.includes("unhandled") ||
                                            lower.includes("segmentation fault") ||
                                            lower.includes("stack overflow") ||
                                            lower.includes("crash") ||
                                            lower.includes("fault")
                                        );
                                        if (containsCrashKeyword) crashDetected = true;
                                        if (
                                            lowerFunc.includes("apppolicygetprocessterminationmethod") ||
                                            lower.includes("killed:")
                                        ) crashDetected = false;
                                    } else {
                                        const lower = line.toLowerCase();
                                        if (
                                            lower.includes("exception") ||
                                            lower.includes("fatal") ||
                                            lower.includes("segmentation fault") ||
                                            lower.includes("crash") ||
                                            lower.includes("failed") ||
                                            lower.includes("panic")
                                        ) crashDetected = true;
                                    };

                                    window.dispatchEvent(new CustomEvent("gameLog", {
                                        detail: msg
                                    }));
                                };
                                break;
                            };
                            case 'exit':
                                const exitCode = evt.detail.data;
                                const duration = Date.now() - startTime;
                                const sessionSeconds = Math.floor(duration / 1000);

                                if (isTranslated) (async () => {
                                    if (instance.compatibilityLayer === "RUNTIME") {
                                        try {
                                            console.log("Soft shutdown wine...");
                                            await Neutralino.os.execCommand(`WINEPREFIX="${prefix}" "${wineServerBin}" -w`);
                                        } catch (e) {
                                            console.log("Force shutdown wine...");
                                            try {
                                                await Neutralino.os.execCommand(`WINEPREFIX="${prefix}" "${wineServerBin}" -k`);
                                            } catch (err) {
                                                console.error("Wineserver couldn't stop:", err);
                                            };
                                        };
                                    } else {
                                        try {
                                            console.log("Soft shutdown wine...");
                                            await Neutralino.os.execCommand(`"${wineServerBin}" -w`);
                                        } catch (e) {
                                            console.log("Force shutdown wine...");
                                            try {
                                                await Neutralino.os.execCommand(`"${wineServerBin}" -k`);
                                            } catch (err) {
                                                console.error("Wineserver couldn't stop:", err);
                                            };
                                        };
                                    };
                                })();

                                const instancePath = await Neutralino.filesystem.getJoinedPath(this.manager.instancesDir, instanceId, "instance.json");
                                const updatedInstance = await this.manager.instances.get(instanceId);

                                updatedInstance.playtime = (updatedInstance.playtime || 0) + sessionSeconds;
                                await this.manager.utils.writeJSON(instancePath, updatedInstance);

                                // crash detection
                                if (!this.userStopped && (exitCode !== 0 || crashDetected)) {
                                    console.log("CRASHED!", exitCode)
                                    window.dispatchEvent(new CustomEvent("gameCrash"));
                                    await new Promise(r => setTimeout(r, 100));
                                };

                                this.userStopped = false;
                                    
                                /*if (exitCode !== 0 && duration < 2000) {
                                    showToast("Error: Failed to launch instance");
                                    console.error(proc.stdErr);
                                };*/

                                Neutralino.events.off('spawnedProcess', handler);
                                if(keepLauncherOpen === false) {
                                    await Neutralino.window.show();
                                    await Neutralino.window.focus();
                                    await Neutralino.window.setAlwaysOnTop(true);
                                    setTimeout(() => { Neutralino.window.setAlwaysOnTop(false); }, 200);
                                };

                                window.dispatchEvent(new CustomEvent("silenceMusic", { detail: false }));
                                window.whenQuitting = undefined;

                                resolve();
                                break;
                        };
                    };
                };
                Neutralino.events.on('spawnedProcess', handler);
                window.dispatchEvent(new CustomEvent("procRunning", { detail: proc }));
            } catch(e) {
                console.log(e);
                if(keepLauncherOpen === false) {
                    await Neutralino.window.show();
                    await Neutralino.window.focus();
                    await Neutralino.window.setAlwaysOnTop(true);
                    setTimeout(() => { Neutralino.window.setAlwaysOnTop(false); }, 200);
                };
                window.dispatchEvent(new CustomEvent("silenceMusic", { detail: false }));
                window.whenQuitting = undefined;
                resolve();
            };
        });
    };

    async stop(pid) {
        try {
            showToast("Stopping instance...");
            if(window.whenQuitting) await window.whenQuitting();
            await Neutralino.os.updateSpawnedProcess(pid, 'exit');
        } catch (e) {
            this.userStopped = false;
            console.error("Failed to stop process:", e);
        };
    };
};