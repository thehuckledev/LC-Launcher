import Neutralino from "@neutralinojs/lib";
import { showToast } from "../components/Toast";
import { getSetting } from "../utils/settingsManager.js";
import Download from "../utils/download.js";
import Unzip from "../utils/unzip.js";

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

    async setupDXVK(instancePath) {
        const dxvkLibDir = `${await getSetting("dataDirectory")}/libraries/dxvk`;
        const winePrefix = `${instancePath}/pfx`;

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

            const release = await this.manager.remotes.get(instance.repo, instance.tag);
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
            const download = await new Download(asset.browser_download_url, { label: `Downloading instance${isUpdate ? ' update' : ''}` });
            try {
                await download.start(zipPath);
            } catch(e) {
                console.error(e);
                return showToast("Error: Asset download failed");
            };

            console.log("Extracting build...");
            await this.backupPreserved(instancePath);
            const unzipContent = new Unzip(zipPath, `${instancePath}/content`, { label: `Extracting instance${isUpdate ? ' update' : ''}` });
            try {
                await unzipContent.start();
            } catch(e) {
                console.error(e);
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
        const release = await this.manager.remotes.get(instance.repo, instance.tag);
        if (!release) return false;

        const asset = instance.target
            ? release.assets.find(a => a.name === instance.target)
            : release.assets[0];
        return asset.id !== instance.assetId;
    };

    async writeSkin(instanceId, dataURI) {
        try {
            const baseDir = `${this.manager.instancesDir}/${instanceId}/content`;
            const filePath = `${baseDir}/Common/res/mob/char.png`;

            if (!dataURI) {
                await this.manager.utils.ensureDir(`${baseDir}/Common/res/mob`);
                await Neutralino.resources.extractFile('/src/assets/misc/char.png', filePath);
                return console.log("Skin written to:", filePath);
            };
            
            const response = await fetch(dataURI);
            const arrayBuffer = await response.arrayBuffer();

            await this.manager.utils.ensureDir(`${baseDir}/Common/res/mob`);
            await Neutralino.filesystem.writeBinaryFile(filePath, arrayBuffer);
            console.log("Skin written to:", filePath);
        } catch (err) {
            console.error("Failed to write skin:", err);
            return showToast("Error: Skin couldn't be written to instance");
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

        if (await this.needsUpdate(instance)) {
            console.log("Updating instance...");
            await this.installInstance(instance, true);
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

        // compatibility layers
        if (NL_OS === "Linux" || NL_OS === "Darwin") {
            const compat = instance.compatibilityLayer;

            if (compat === "WINE" || compat === "WINE64") {
                let bin;
                const prefix = `${cwd}/pfx`;

                //DONE TODO make the cmd a fallback for the built in binaries and add a popup which prompts if they want to install using prebuilt binaries
                try {
                    const dataDir = await getSetting("dataDirectory");
                    await Neutralino.filesystem.getStats(`${dataDir}/libraries/wine-crossover/bin/`);
                    // check if prebuilt installed above

                    const internalWinePath = `${dataDir}/libraries/wine-crossover/bin/wine`;
                    const internalWine64Path = `${dataDir}/libraries/wine-crossover/bin/wine64`;
                    if(compat === "WINE") {
                        try {
                            await Neutralino.filesystem.getStats(internalWinePath);
                            bin = `WINEDLLOVERRIDES="d3d11=n,b;dxgi=n,b" "${internalWinePath}"`;

                            try {
                                await Neutralino.filesystem.getStats(prefix);
                            } catch {
                                showToast('Setting up C Drive...');
                                try { await Neutralino.filesystem.createDirectory(prefix); } catch {};

                                await Neutralino.os.execCommand(`WINEPREFIX="${prefix}" WINEDEBUG=-all ${bin} wineboot --init`);
                                if(NL_OS === 'Darwin') await this.setupDXVK(cwd);
                            };
                        } catch {
                            return showToast(`Error: ${compat} is not installed`);
                        };
                    } else if(compat === "WINE64") {
                        try {
                            await Neutralino.filesystem.getStats(internalWine64Path);
                            bin = `WINEDLLOVERRIDES="d3d11=n,b;dxgi=n,b" "${internalWine64Path}"`;

                            try {
                                await Neutralino.filesystem.getStats(prefix);
                            } catch {
                                showToast('Setting up C Drive...');
                                try { await Neutralino.filesystem.createDirectory(prefix); } catch {};

                                await Neutralino.os.execCommand(`WINEPREFIX="${prefix}" WINEDEBUG=-all ${bin} wineboot --init`);
                                if(NL_OS === 'Darwin') await this.setupDXVK(cwd);
                            };
                        } catch {
                            return showToast(`Error: ${compat} is not installed`);
                        };
                    };
                } catch(e) {
                    bin = compat.toLowerCase();
                    if (!(await this.manager.utils.cmdExists(bin)))
                        return showToast(`Error: ${compat} is not installed`);
                };
                
                cmd = `${instance.customArgs ? `${instance.customArgs} ` : ""}WINEPREFIX="${prefix}" WINEDEBUG=-all ${bin} "${execPath}" ${joinedArgs}`;
            };

            if (compat === "PROTON") {
                if (!(await this.manager.utils.cmdExists("proton"))) return showToast(`Error: proton is not installed`);

                const prefix = `${cwd}/pfx`;
                try { await Neutralino.filesystem.createDirectory(prefix); } catch {};

                cmd =
                    `STEAM_COMPAT_CLIENT_INSTALL_PATH="" ` +
                    `STEAM_COMPAT_DATA_PATH="${prefix}" ` +
                    `proton run "${execPath}" ${joinedArgs}`;
            };

            if (compat === "DIRECT" &&
                execPath.endsWith(".exe")
            ) showToast("You should have a compatibility layer on linux and macOS", 1000);
        };

        showToast("Launching instance...", 1000);
        console.log("Launching:", cmd);

        const startTime = Date.now();
        const proc = await Neutralino.os.execCommand(cmd, { cwd });
        const duration = Date.now() - startTime;
        const sessionSeconds = Math.floor(duration / 1000);

        const instancePath = await Neutralino.filesystem.getJoinedPath(this.manager.instancesDir, instanceId, "instance.json");
        const updatedInstance = await this.manager.instances.get(instanceId);

        updatedInstance.playtime = (updatedInstance.playtime || 0) + sessionSeconds;
        await this.manager.utils.writeJSON(instancePath, updatedInstance);

        if (proc.exitCode !== 0 && duration < 2000) {
            showToast("Error: Failed to launch instance");
            console.error(proc.stdErr);
        };
    };
};