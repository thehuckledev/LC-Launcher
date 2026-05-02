import Neutralino from "@neutralinojs/lib";
import { showToast } from "../components/Toast";
import { getSetting } from "../utils/settingsManager.js";
import Download from "../utils/download.js";
import Unzip from "../utils/unzip.js";

import charPng from '../assets/misc/char.png';

export class Exec {
    constructor(manager) {
        this.manager = manager;
        this.init();
    };

    async init() {
        this.preserveList = [
            "options.txt",
            "settings.dat",
            "pfx",
            await Neutralino.filesystem.getJoinedPath("Windows64", "GameHDD")
        ];
    };

    async setupDXVK() {
        const dataDir = await getSetting("dataDirectory");
        const dxvkLibDir = `${dataDir}/libraries/dxvk`;
        const winePrefix = `${dataDir}/pfx`;

        const system32 = `${winePrefix}/drive_c/windows/system32`;
        const syswow64 = `${winePrefix}/drive_c/windows/syswow64`;

        try {
            await Neutralino.os.execCommand(`cp -f "${dxvkLibDir}/x64/"*.dll "${system32}"`);
            await Neutralino.os.execCommand(`cp -f "${dxvkLibDir}/x32/"*.dll "${syswow64}"`);

            showToast("DXVK Applied to Wine", 2000);
        } catch (err) {
            console.error("DXVK setup failed:", err);
            showToast("Failed to apply DXVK");
        };
    };

    async backupPreserved(instancePath) {
        const backupDir = await Neutralino.filesystem.getJoinedPath(instancePath, "backup");
        await this.manager.utils.ensureDir(backupDir);

        for (const rel of this.preserveList) {
            const src = await Neutralino.filesystem.getJoinedPath(instancePath, "content", rel);
            const dst = await Neutralino.filesystem.getJoinedPath(backupDir, rel);

            try {
                await Neutralino.filesystem.copy(src, dst, {
                    recursive: true,
                    overwrite: true
                });
            } catch {};
        };
    };

    async restorePreserved(instancePath) {
        const backupDir = await Neutralino.filesystem.getJoinedPath(instancePath, "backup");

        for (const rel of this.preserveList) {
            const src = await Neutralino.filesystem.getJoinedPath(backupDir, rel);
            const dst = await Neutralino.filesystem.getJoinedPath(instancePath, "content", rel);

            try {
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

            await this.manager.utils.ensureDir(instancePath);
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

                // fix some zips having folders but some using root
                const entries = await Neutralino.filesystem.readDirectory(contentDir);
                if (entries.length === 1 && entries[0].type === 'DIRECTORY') {
                    const rootDirName = entries[0].entry;
                    const rootDirPath = await Neutralino.filesystem.getJoinedPath(contentDir, rootDirName);
                    
                    const rootFiles = await Neutralino.filesystem.readDirectory(rootDirPath);
                    for (const file of rootFiles) {
                        const srcPath = await Neutralino.filesystem.getJoinedPath(rootDirPath, file.entry);
                        const destPath = await Neutralino.filesystem.getJoinedPath(contentDir, file.entry);
                        
                        if (NL_OS === "Windows") await Neutralino.os.execCommand(`move "${srcPath}" "${destPath}"`);
                        else await Neutralino.os.execCommand(`mv "${srcPath}" "${destPath}"`);
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
            showToast(`Instance${isUpdate ? ' update' : ''} completed`);
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

        if (!instance.installed) await this.installInstance(instance);
        if (!instance.installed) return;

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
        if (instance.fullscreen) args.push("-fullscreen");

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

            if (compat === "WINE" || compat === "WINE64") {
                if (NL_OS === "Darwin") {
                    try {
                        await Neutralino.filesystem.getStats(`${runtimePath}/bin/wine64`);
                        const winePath = `${runtimePath}/bin/wine64`;
                        wineServerBin = `${runtimePath}/bin/wineserver`;
                        
                        const env = `WINEPREFIX="${prefix}" WINEESYNC=1 MTL_HUD_ENABLED=0 WINEDLLOVERRIDES="d3d11=n,b;dxgi=n,b"`;
                        bin = `${env} "${winePath}"`;
                        
                        try { await Neutralino.filesystem.getStats(prefix); } catch {
                            showToast('Setting up C Drive...');
                            await Neutralino.os.execCommand(`${env} "${winePath}" wineboot --init`);
                            await this.setupDXVK();
                        }
                    } catch (e) {
                        bin = `WINEPREFIX="${prefix}" ${compat.toLowerCase()}`;
                    };
                } else {
                    bin = `WINEPREFIX="${prefix}" ${compat.toLowerCase()}`;
                };
            };

            if (compat === "PROTON") {
                if (NL_OS === "Linux") {
                    try {
                        await Neutralino.filesystem.getStats(`${runtimePath}/bin/wine`);
                        const winePath = `${runtimePath}/bin/wine`;
                        wineServerBin = `${runtimePath}/bin/wineserver`;

                        const env = `WINEPREFIX="${prefix}" WINEESYNC=1 STEAM_COMPAT_CLIENT_INSTALL_PATH="/tmp" STEAM_COMPAT_DATA_PATH="${prefix}"`;
                        bin = `${env} "${winePath}"`;

                        try { await Neutralino.filesystem.getStats(prefix); } catch {
                            showToast('Setting up C Drive...');
                            await Neutralino.os.execCommand(`${env} "${winePath}" wineboot --init`);
                        }
                    } catch (e) {
                        bin = `STEAM_COMPAT_CLIENT_INSTALL_PATH="" STEAM_COMPAT_DATA_PATH="${prefix}" proton run`;
                    };
                } else {
                    bin = `STEAM_COMPAT_CLIENT_INSTALL_PATH="" STEAM_COMPAT_DATA_PATH="${prefix}" proton run`;
                };
            };

            if (bin !== "") {
                const baseCmd = bin.split(" ").pop().replace(/"/g, "");
                if (baseCmd.includes("/") || await this.manager.utils.cmdExists(baseCmd)) {
                    const debug = "WINEDEBUG=err+all,warn+d3d,warn+msvcrt,fixme+d3d,fixme+ntdll,+timestamp";
                    cmd = `${instance.customArgs ? `${instance.customArgs} ` : ""}${debug} ${bin} "${execPath}" ${joinedArgs}`;
                } else return showToast(`Error: ${compat} is not installed on your system`);
            };

            if (compat === "DIRECT" && execPath.endsWith(".exe"))
                showToast("You should have a compatibility layer on Linux and macOS", 1000);
        };

        showToast("Launching instance...", 1000);
        console.log("Launching:", cmd);

        window.dispatchEvent(new CustomEvent("silenceMusic", { detail: true }));
        const isTranslated = instance.compatibilityLayer !== "DIRECT" && (NL_OS === "Linux" || NL_OS === "Darwin");
        const keepLauncherOpen = await getSetting("keepLauncherOpen");
        return new Promise(async (resolve) => {
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

                        if (NL_OS === "Windows") {
                            await Neutralino.os.execCommand(`taskkill /PID ${proc.pid} /T /F`);
                        } else {
                            try {
                                await Neutralino.os.execCommand(`WINEPREFIX="${prefix}" "${wineServerBin}" -k`);
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
                                for (const line of lines) {
                                    let msg = { type: "err", from: "DIRECT", message: line };
                                    if(isTranslated) { // parse wine logs
                                        const parsed = this.parseWINELog(line);
                                        if (!parsed) continue;
                                        parsed.from = "WINE";
                                        msg = parsed;

                                        const lower = parsed.message?.toLowerCase() || "";
                                        if (
                                            lower.includes("unhandled") ||
                                            lower.includes("segmentation fault") ||
                                            lower.includes("stack overflow") ||
                                            lower.includes("crash") ||
                                            lower.includes("fault")
                                        ) crashDetected = true;
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
                                })();

                                const instancePath = await Neutralino.filesystem.getJoinedPath(this.manager.instancesDir, instanceId, "instance.json");
                                const updatedInstance = await this.manager.instances.get(instanceId);

                                updatedInstance.playtime = (updatedInstance.playtime || 0) + sessionSeconds;
                                await this.manager.utils.writeJSON(instancePath, updatedInstance);

                                // crash detection
                                if (exitCode !== 0 || crashDetected) {
                                    console.log("CRASHED!", exitCode)
                                    window.dispatchEvent(new CustomEvent("gameCrash"));
                                    await new Promise(r => setTimeout(r, 100));
                                };
                                    
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
};