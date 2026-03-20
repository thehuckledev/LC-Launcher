import Neutralino from "@neutralinojs/lib";
import { showToast } from "../components/Toast";

export class Exec {
    constructor(manager) {
        this.manager = manager;
        this.init();
    };

    async init() {
        this.preserveList = [
            "options.txt",
            "settings.dat",
            await Neutralino.filesystem.getJoinedPath("Windows64", "GameHDD")
        ];
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

    async installInstance(instance) {
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
            const zipPath = await Neutralino.filesystem.getJoinedPath(instancePath, `${instance.target}.zip`);

            await this.manager.utils.ensureDir(instancePath);
            await this.manager.utils.ensureDir(await Neutralino.filesystem.getJoinedPath(instancePath, 'content'));

            showToast("Downloading instance update...");
            console.log("Downloading build...");
            const download = await Neutralino.os.execCommand(`curl -L "${asset.browser_download_url}" -o "${zipPath}"`);
            if (download.exitCode !== 0) return showToast("Error: Asset download failed");

            showToast("Extracting instance update...");
            console.log("Extracting build...");
            await this.backupPreserved(instancePath);
            const unzip = await Neutralino.os.execCommand(`unzip -o "${zipPath}" -d "${instancePath}/content"`);
            await this.restorePreserved(instancePath);
            if (unzip.exitCode !== 0) return showToast("Error: Asset unzip failed");

            instance.assetId = asset.id;
            instance.installed = true;

            await this.manager.utils.writeJSON(`${instancePath}/instance.json`, instance);
            console.log("Instance installed");
            showToast("Instance update completed");
        } catch (err) {
            console.error(err);
            showToast(`Error: ${err.message}`);

            try {
                await Neutralino.filesystem.remove(`${this.manager.instancesDir}/${instance.id}/${instance.target}.zip`);
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
                await this.ensureDir(`${baseDir}/Common/res/mob`);
                await Neutralino.resources.extractFile('/src/assets/misc/char.png', filePath);
                return console.log("Skin written to:", filePath);
            };
            
            const response = await fetch(dataURI);
            const arrayBuffer = await response.arrayBuffer();

            await this.ensureDir(`${baseDir}/Common/res/mob`);
            await Neutralino.filesystem.writeBinaryFile(filePath, arrayBuffer);
            console.log("Skin written to:", filePath);
        } catch (err) {
            console.error("Failed to write skin:", err);
            return showToast("Error: Skin couldn't be written to instance");
        };
    };

    async launch(instanceId, profileId) {
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
            await this.installInstance(instance);
        };

        // save skin from datauri
        await this.writeSkin(instanceId, profile.skin);

        const cwd = await Neutralino.filesystem.getJoinedPath(this.manager.instancesDir, instanceId, "content");
        const execPath = await Neutralino.filesystem.getJoinedPath(cwd, instance.exec);

        // write uid
        await Neutralino.filesystem.writeFile(await Neutralino.filesystem.getJoinedPath(cwd, "uid.dat"), `${profile.uid}\n`);

        // write servers.txt
        const servers = await this.manager.servers.list(instanceId);

        const content = servers
            .map(s => `${s.ip}\n${s.port}\n${s.name}`)
            .join("\n") + (servers.length ? "\n" : "");
        const path = await Neutralino.filesystem.getJoinedPath(
            this.manager.instancesDir,
            instanceId,
            "content",
            "servers.txt"
        );

        await Neutralino.filesystem.writeFile(path, content);


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
                const bin = compat.toLowerCase();
                if (!(await this.manager.utils.cmdExists(bin))) return showToast(`Error: ${bin} is not installed`);

                cmd = `${bin} "${execPath}" ${joinedArgs}`;
            };

            if (compat === "PROTON") {
                if (!(await this.manager.utils.cmdExists("proton"))) return showToast(`Error: proton is not installed`);

                const prefix = `${cwd}/pfx`;
                try { await Neutralino.filesystem.createDirectory(prefix); } catch { }

                cmd =
                    `STEAM_COMPAT_CLIENT_INSTALL_PATH="" ` +
                    `STEAM_COMPAT_DATA_PATH="${prefix}" ` +
                    `proton run "${execPath}" ${joinedArgs}`;
            };

            if (compat === "DIRECT") showToast("You should have a compatibility layer on linux and macOS");
        };

        showToast("Launching instance...");
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