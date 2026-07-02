import Neutralino from "@neutralinojs/lib";

import Net from '../lib/net.js';
import Filesystem from "../lib/filesystem.js";
import ChildProcess from "../lib/childProcess.js";

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

    async installInstance(instance, isUpdate = false, keepData = true) {
        try {
            await this._installInstance(instance, isUpdate, keepData);
        } catch (err) {
            console.error(err);
            showToast(`Error: ${err.message}`);
        } finally {
            try { // remove zip
                const targetArchive = instance.target || "download.zip";
                const archivePath = await Neutralino.filesystem.getJoinedPath(this.manager.instancesDir, instance.id, targetArchive);
                await Neutralino.filesystem.remove(archivePath);
            } catch {};
        };
    };

    async _installInstance(instance, isUpdate = false, keepData = true) {
        const instancePath = await Neutralino.filesystem.getJoinedPath(this.manager.instancesDir, instance.id);
        //const contentDir = await Neutralino.filesystem.getJoinedPath(instancePath, 'content'); // this resolves to symlink dest which causes issues when deleting
        const contentDir = `${instancePath}/content`;

        //await Neutralino.filesystem.remove(contentDir).catch(e=>{}); // this doesn't work for symlinks

        if (instance.serviceType === "LOCAL") {
            try {
                await Filesystem.unlink(contentDir).catch(e => {});
            } catch(e) {
                await Neutralino.filesystem.remove(contentDir).catch(e => {});
            };
            await Filesystem.symlink(contentDir, instance.repo.trim());
            
            instance.installed = true;
            await this.manager.utils.writeJSON(`${instancePath}/instance.json`, instance);
            return showToast("Linked local build path");
        };

        if (!navigator.onLine) return showToast("Error: You must be online to install an instance");

        if (isUpdate === false) {
            // read servers.db
            await this.manager.servers.read(instance.id);
        };

        if (keepData === false) await Neutralino.filesystem.remove(`${instancePath}/servers.json`).catch(e=>{}); // delete all servers
        if (keepData === true) await this.backupPreserved(instancePath);

        await Neutralino.filesystem.remove(contentDir).catch(e => {});

        let downloadUrl = "";
        let archiveName = "";

        if (instance.serviceType === "URL") {
            downloadUrl = instance.repo;
            archiveName = instance.target || "download.zip"; // if people had the old neolegacy where it was a git server, then it will still have target, as it doesnt update!

            try {
                const head = await Net.head(instance.repo);
                const LastModified = head.headers['last-modified'];
                if (LastModified) instance.assetId = LastModified;
                else {
                    const ETag = head.headers['etag'];
                    if (ETag) instance.assetId = ETag;
                };
            } catch {};
        } else {
            const release = await this.manager.remotes.get(instance, instance.tag);
            if (!release) return showToast("Error: Release not found");

            if (!release.assets || release.assets.length === 0)
                return showToast("Error: No assets found in this release");

            const asset = instance.target
                ? release.assets.find(a => a.name === instance.target)
                : release.assets[0];
            if (!asset) return showToast("Error: Required asset not found in release");
            
            downloadUrl = asset.browser_download_url;
            archiveName = instance.target;
            instance.assetId = asset.id;
        };

        const zipPath = await Neutralino.filesystem.getJoinedPath(instancePath, archiveName);

        await this.manager.utils.ensureDir(contentDir);

        console.log("Downloading build...");
        const download = new Download(downloadUrl, { label: `Downloading instance${isUpdate ? ' update' : ''}...` });
        try {
            await download.start(zipPath);
        } catch(e) {
            console.error(e);
            return showToast("Error: Asset download failed");
        };

        console.log("Extracting build...");
        const unzipContent = new Unzip(zipPath, contentDir, { label: `Extracting instance${isUpdate ? ' update' : ''}...` });
        try {
            await unzipContent.start();
        } catch(e) {
            console.error(e);
            try { // remove zip
                await Neutralino.filesystem.remove(zipPath);
            } catch { }
            return showToast("Error: Asset unzip failed");
        };
        if (keepData === true) await this.restorePreserved(instancePath);

        instance.installed = true;

        await this.manager.utils.writeJSON(`${instancePath}/instance.json`, instance);
        console.log("Instance installed");
        showToast(`Instance${isUpdate ? ' update' : ''} installed`);
    };

    async needsUpdate(instance) {
        try {
            if (instance.serviceType === "LOCAL") return false;

            if (instance.serviceType === "URL") {
                if (!instance.assetId) return false;

                const head = await Net.head(instance.repo);
                const serverLastModified = head.headers['last-modified'];
                if (!serverLastModified) {
                    const serverETag = head.headers['etag'];
                    if (!serverETag) return false;

                    return serverETag !== instance.assetId;
                };

                return serverLastModified !== instance.assetId;
            };

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
                if(NL_ARGS.includes("--neu-dev-extension")) await Neutralino.resources.extractFile(`/src${charPng}`, filePath); // dev mode acts differently as the resources path is different due to vite bundling
                else await Neutralino.resources.extractFile(`/public${charPng}`, filePath);
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
        const regex = /^(?:\[[^\]]+\]\s*){0,2}(?:([\d.]+):)?(?:([a-f0-9]{4}):)?([a-z]+):([^:\s]+?)(?::|\s)+(?:([^:\s]+)(?:\s|:))?(.*)$/i;
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

            let apiResponse = await Net.get(`https://api.github.com/repos/${repo}/releases/latest`, {
                headers: {
                    "Accept": "application/vnd.github+json",
                    "User-Agent": "LC-Launcher",
                    "X-GitHub-Api-Version": "2026-03-10"
                }
            });
            if (!apiResponse.ok) throw new Error("Releases API not reachable");
            let releaseData = apiResponse.data;

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
                const internalRuntimeSource = `${runtimeTempDir}/Contents/Resources/wine`;
                await Neutralino.os.execCommand(`cp -R "${internalRuntimeSource}/." "${runtimeDir}"`);
                await Neutralino.os.execCommand(`xattr -rd com.apple.quarantine "${runtimeDir}"`);
            };
            await Neutralino.os.execCommand(`chmod -R 755 "${runtimeDir}"`);

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

    async launch(instanceId, profileId, ip, port = "25565") {
        try {
            window.dispatchEvent(new CustomEvent("execProcessing", { detail: true }));
            await this._launch(instanceId, profileId, ip, port);
        } catch {} finally {
            window.dispatchEvent(new CustomEvent("execProcessing", { detail: false }));
        };
    };

    async _launch(instanceId, profileId, ip, port) {
        if (!instanceId) return showToast("You need to create an instance");
        if (!profileId) return showToast("You need to create a profile");

        const instance = await this.manager.instances.get(instanceId);
        if (!instance) return showToast("Error: Instance not found");

        const profile = await this.manager.profiles.get(profileId);
        if (!profile) return showToast("Error: Profile not found");

        if (!instance.installed) return await this.installInstance(instance, false, false);

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
        if (
            (NL_OS === "Linux" || NL_OS === "Darwin") &&
            instance.compatibilityLayer === "RUNTIME" &&
            !hasProton
        ) {
            const dataDir = await getSetting("dataDirectory");
            const runtimePath = `${dataDir}/libraries/runtime`;

            try {
                await Neutralino.filesystem.getStats(`${runtimePath}/bin/${NL_OS === "Darwin" ? 'wine64' : 'wine'}`);
            } catch {
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

        // check if symlink stil exists lol
        const contentDir = await Neutralino.filesystem.getJoinedPath(this.manager.instancesDir, instance.id, 'content');
        try {
            const stats = await Neutralino.filesystem.getStats(contentDir);
            //if (stats.type !== "FILE") throw new Error(); // symlinks seem to count as files
        } catch(e) {
            if(instance.serviceType === "LOCAL") return showToast("Local Build Directory does not exist");
            else return showToast("Content Directory does not exist");
        };

        // save skin from datauri
        await this.writeSkin(instanceId, profile.skin);

        const cwd = await Neutralino.filesystem.getJoinedPath(this.manager.instancesDir, instanceId, "content");
        const execPath = await Neutralino.filesystem.getJoinedPath(cwd, instance.exec);

        // write uid
        const uidPath = await Neutralino.filesystem.getJoinedPath(cwd, "uid.dat");
        await Neutralino.filesystem.writeFile(uidPath, `${profile.uid}\n`);
        console.log("UID written to:", uidPath, profile.uid);

        // write servers.db
        await this.manager.servers.write(instanceId);

        // write profile instance files
        await this.manager.profiles.writeInstanceFiles(profileId, instanceId);


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
        if (instance.quitOnDisconnect === true) args.push("-quitondisconnect");

        if (instance.ip && !ip) args.push("-ip", instance.ip);
        if (instance.port && !port) args.push("-port", instance.port);
        if (ip) args.push("-ip", ip);
        if (port) args.push("-port", port);

        const joinedArgs = args.map(a => `"${a}"`).join(" ");
        let cmd = `"${execPath}" ${joinedArgs}`;

        const dataDir = await getSetting("dataDirectory");
        const prefix = `${dataDir}/pfx`;

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
                        
                        const env = `WINEPREFIX="${prefix}" WINEESYNC=1 MTL_HUD_ENABLED=0`;
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
                    const env = `PROTON_USE_NTSYNC=1 STEAM_COMPAT_CLIENT_INSTALL_PATH="~/.steam/steam" STEAM_COMPAT_DATA_PATH="${prefix}"`;
                    
                    if (protonPath) bin = `${env} "${protonPath}" run`;
                    else {
                        try {
                            await Neutralino.filesystem.getStats(`${runtimePath}/proton`);
                            const runtimeProtonPath = `${runtimePath}/proton`;
                            bin = `${env} "${runtimeProtonPath}" run`;
                        } catch (e) {
                            bin = `${env} proton run`;
                        };
                    };

                    await this.manager.utils.ensureDir(prefix);
                };
            }

            else if (compat === "WINE" || compat === "WINE64")
                bin = compat.toLowerCase();

            else if (compat === "PROTON") {
                const protonPath = await this.findProtonPath();
                const env = `PROTON_USE_NTSYNC=1 STEAM_COMPAT_CLIENT_INSTALL_PATH="~/.steam/steam" STEAM_COMPAT_DATA_PATH="${prefix}"`;

                await this.manager.utils.ensureDir(prefix);
                
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

        const cmdParts = cmd.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
        const parsedArgs = [];
        const parsedEnvs = {};
        let parsedCmd = null;

        for (const part of cmdParts) {
            const strippedPart = part.replace(/"/g, "");
            if (!parsedCmd && strippedPart.includes("=") && !strippedPart.startsWith("-") && !strippedPart.startsWith("/")) {
                const eqIndex = strippedPart.indexOf("=");
                const key = strippedPart.substring(0, eqIndex);
                const value = strippedPart.substring(eqIndex + 1);
                parsedEnvs[key] = value;
            } else {
                if (!parsedCmd) parsedCmd = strippedPart;
                else parsedArgs.push(strippedPart);
            };
        };

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

                const proc = await ChildProcess.spawn(parsedCmd, parsedArgs, {
                    cwd: cwd,
                    env: parsedEnvs
                });

                window.whenQuitting = async (ev) => { // close game also
                    this.userStopped = true;
                    await ChildProcess.kill(proc.id).catch(()=>{});
                    await new Promise(r => setTimeout(r, 200));
                };

                const handler = async (evt) => {
                    const { action, data } = evt.detail;

                    switch (action) {
                        case 'stdOut': {
                            if(keepLauncherOpen === false) return;

                            const lines = data.split(/\r?\n/);
                            for (const line of lines) {
                                window.dispatchEvent(new CustomEvent("gameLog", {
                                    detail: { type: "out", from: "DIRECT", message: line }
                                }));
                            };
                            break;
                        };
                        case 'stdErr': {
                            if(keepLauncherOpen === false) return;

                            let lines = data.split(/\r?\n/);
                            for await (const line of lines) {
                                let msg = { type: "err", from: "DIRECT", message: line };
                                if(isTranslated) { // parse wine logs
                                    const parsed = this.parseWINELog(line);
                                    if (!parsed) continue;
                                    parsed.from = "WINE";
                                    msg = parsed;

                                    const lower = parsed.message?.toLowerCase() || "";
                                    const lowerFunc = parsed.func?.toLowerCase() || "";
                                    const level = parsed.level;

                                    const containsCrashKeyword = (
                                        lower.includes("unhandled exception") ||
                                        lower.includes("segmentation fault") ||
                                        lower.includes("stack overflow") ||
                                        lower.includes("crash") ||
                                        lower.includes("fault")
                                    );

                                    if (containsCrashKeyword && level !== "fixme" && level !== "warn") crashDetected = true;
                                    if (
                                        lowerFunc.includes("apppolicygetprocessterminationmethod") ||
                                        lower.includes("killed:")
                                    ) crashDetected = false;
                                };

                                window.dispatchEvent(new CustomEvent("gameLog", {
                                    detail: msg
                                }));
                            };
                            break;
                        };
                        case 'exit':
                            const exitCode = data;
                            const duration = Date.now() - startTime;
                            const sessionSeconds = Math.floor(duration / 1000);

                            // update playtime
                            const instancePath = await Neutralino.filesystem.getJoinedPath(this.manager.instancesDir, instanceId, "instance.json");
                            const updatedInstance = await this.manager.instances.get(instanceId);

                            const newPlaytime = (updatedInstance.playtime || 0) + sessionSeconds;
                            const newPlaytimeSessions = [
                                ...(updatedInstance.playtimeSessions || []),
                                {
                                    date: Date.now(),
                                    duration: sessionSeconds
                                }
                            ];

                            await this.manager.instances.update(updatedInstance.id, {
                                playtime: newPlaytime,
                                playtimeSessions: sessionSeconds > 60 ? newPlaytimeSessions : updatedInstance.playtimeSessions
                            });

                            // read servers.db
                            await this.manager.servers.read(instanceId);

                            // read profile instance files
                            await this.manager.profiles.readInstanceFiles(profileId, instanceId);

                            // crash detection
                            if (!this.userStopped && (exitCode !== 0 || crashDetected)) {
                                console.log("CRASHED!", exitCode)
                                window.dispatchEvent(new CustomEvent("gameCrash"));
                                await new Promise(r => setTimeout(r, 100));
                            };

                            this.userStopped = false;

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

                window.addEventListener(`proc:${proc.id}`, handler);
                window.dispatchEvent(new CustomEvent("procRunning", { detail: proc.id }));
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

    async stop(id) {
        try {
            showToast("Stopping instance...");
            if(window.whenQuitting) await window.whenQuitting();
            await ChildProcess.kill(id);
        } catch (e) {
            this.userStopped = false;
            console.error("Failed to stop process:", e);
        };
    };
};