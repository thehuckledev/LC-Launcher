// thanks to https://git.huckle.dev/Huckles-Minecraft-Archive/LegacyLauncher/src/branch/main/renderer.js
// reading through it helped me understand how to change skins etc.

import Neutralino from "@neutralinojs/lib";
import { showToast } from "../components/Toast";

export class Manager {
    constructor() {
        this.dataDir = null;
        this.profilesFile = null;
        this.instancesDir = null;
    }

    async init() {
        this.dataDir = JSON.parse(await Neutralino.storage.getData("settings-dataDirectory"));
        this.profilesFile = await Neutralino.filesystem.getJoinedPath(this.dataDir, "profiles.json");
        this.instancesDir = await Neutralino.filesystem.getJoinedPath(this.dataDir, "instances");

        await this.ensureDir(this.dataDir);
        await this.ensureDir(this.instancesDir);

        // make profile if it doesnt exist
        try {
            await Neutralino.filesystem.getStats(this.profilesFile);
        } catch {
            await Neutralino.filesystem.writeFile(this.profilesFile, JSON.stringify([], null, 2));
        };

        this.preserveList = [
            "options.txt",
            "settings.dat",
            await Neutralino.filesystem.getJoinedPath("Windows64", "GameHDD")
        ];

        window.manager = this;
    };

    //! utils
    generateUID() {
        let x = crypto.getRandomValues(new BigUint64Array(1))[0];
        x |= 0x8000000000000000n;
        return "0x" + x.toString(16).padStart(16, "0").toUpperCase();
    };

    async cmdExists(cmd) {
        try {
            const res = await Neutralino.os.execCommand(`command -v "${cmd}"`);
            return res.exitCode === 0 && res.stdOut.trim().length > 0;
        } catch {
            return false;
        };
    };

    async ensureDir(path) {
        try {
            const stats = await Neutralino.filesystem.getStats(path);
            if (stats.type == "FILE") throw new Error();
        } catch {
            await Neutralino.filesystem.createDirectory(path);
        };
    };

    async readJSON(path) {
        const txt = await Neutralino.filesystem.readFile(path);
        return JSON.parse(txt);
    };

    async writeJSON(path, data) {
        await Neutralino.filesystem.writeFile(path, JSON.stringify(data, null, 2));
    };

    //! profile
    async getProfiles() {
        return await this.readJSON(this.profilesFile);
    };

    async getProfile(id) {
        const profiles = await this.getProfiles();
        return profiles.find(p => p.id === id);
    };

    async createProfile(username, skinDataURI, skinRenderDataURI) {
        const profiles = await this.getProfiles();

        const profile = {
            id: crypto.randomUUID(),
            username,
            uid: this.generateUID(),
            type: "OFFLINE",
            skin: skinDataURI,
            skinRender: skinRenderDataURI
        };

        profiles.push(profile);
        await this.writeJSON(this.profilesFile, profiles);

        return profile;
    };

    async editProfile(id, prop, value) {
        const profiles = await this.getProfiles();

        const profile = profiles.find(p => p.id === id);
        if (!profile) return "Profile not found";
        profile[prop] = value;

        await this.writeJSON(this.profilesFile, profiles);
    };

    async deleteProfile(id) {
        let profiles = await this.getProfiles();
        profiles = profiles.filter(p => p.id !== id);

        await this.writeJSON(this.profilesFile, profiles);
    };

    //! instances remotes
    async getReleases(repo) {
        const res = await fetch(`https://api.github.com/repos/${repo}/releases`);
        return await res.json();
    };

    async getRelease(repo, tag) {
        const releases = await this.getReleases(repo);
        return releases.find(r => r.tag_name === tag);
    };

    //! worlds
    async listWorlds(instanceId) {
        const dir = await Neutralino.filesystem.getJoinedPath(this.instancesDir, instanceId, "content", "Windows64", "GameHDD");

        try {
            const entries = await Neutralino.filesystem.readDirectory(dir);
            const worlds = [];
            for (const e of entries) {
                if (e.type !== "DIRECTORY") continue;

                const worldPath = await Neutralino.filesystem.getJoinedPath(dir, e.entry);
                
                // cant figure out how to get world name yet
                worlds.push({
                    id: e.entry,
                    name: e.entry,
                    path: worldPath
                });
            };

            return worlds;
        } catch {
            return [];
        };
    };

    async importWorld(instanceId) {
        const worldsDir = await Neutralino.filesystem.getJoinedPath(this.instancesDir, instanceId, "content", "Windows64", "GameHDD");
        await this.ensureDir(worldsDir);

        const res = await Neutralino.os.showOpenDialog(
            "Import world",
            { multiSelections: false }
        );
        if (!res || res.length === 0) return;

        const src = res[0];
        const name = src.split(/[\\/]/).pop();
        const dst = await Neutralino.filesystem.getJoinedPath(worldsDir, name);

        try {
            await Neutralino.filesystem.copy(src, dst, {
                recursive: true
            });
            showToast("World imported");
        } catch (err) {
            console.error(err);
            showToast("Error: Couldn't import world");
        };
    };

    async exportWorld(instanceId, worldId) {
        const worldsDir = await Neutralino.filesystem.getJoinedPath(this.instancesDir, instanceId, "content", "Windows64", "GameHDD");
        const worldPath = await Neutralino.filesystem.getJoinedPath(worldsDir, worldId);

        const res = await Neutralino.os.showSaveDialog(
            "Export world",
            { defaultPath: `${worldId}` }
        );
        if (!res) return;

        try {
            await Neutralino.filesystem.copy(worldPath, res, {
                recursive: true
            });
            showToast("World exported");
        } catch (err) {
            console.error(err);
            showToast("Error: Couldn't export world");
        };
    };

    async deleteWorld(instanceId, worldId) {
        const worldsDir = await Neutralino.filesystem.getJoinedPath(this.instancesDir, instanceId, "content", "Windows64", "GameHDD");
        const worldPath = await Neutralino.filesystem.getJoinedPath(worldsDir, worldId);

        try {
            await Neutralino.filesystem.remove(worldPath);
            showToast("World deleted");
        } catch {
            showToast("Error: Couldn't delete world");
        };
    };

    //! servers
    async listServers(instanceId) {
        const path = await Neutralino.filesystem.getJoinedPath(
            this.instancesDir,
            instanceId,
            "servers.json"
        );

        try { return JSON.parse(await Neutralino.filesystem.readFile(path)); }
        catch { return []; };
    };

    async getServer(instanceId, id) {
        const servers = await this.listServers(instanceId);
        return servers.find(s => s.id === id) ?? null;
    };

    async addServer(instanceId, name, ip, port = "25565") {
        if (!name || !ip) throw new Error("Name and IP required");

        const path = await Neutralino.filesystem.getJoinedPath(
            this.instancesDir,
            instanceId,
            "servers.json"
        );
        const servers = await this.listServers(instanceId);

        if (servers.some(s => s.ip === ip && s.port === port))
            throw new Error("Server already exists");

        servers.push({
            id: crypto.randomUUID(),
            name,
            ip,
            port
        });

        await Neutralino.filesystem.writeFile(path, JSON.stringify(servers, null, 2));
    };

    async removeServer(instanceId, id) {
        const path = await Neutralino.filesystem.getJoinedPath(
            this.instancesDir,
            instanceId,
            "servers.json"
        );
        const servers = await this.listServers(instanceId);

        const filtered = servers.filter(s => s.id !== id);
        if (filtered.length === servers.length) return false;

        await Neutralino.filesystem.writeFile(path, JSON.stringify(filtered, null, 2));
        return true;
    };

    //! instances
    async getInstances() {
        const list = await Neutralino.filesystem.readDirectory(this.instancesDir);

        return list
            .filter(e => e.type === "DIRECTORY")
            .map(e => e.entry);
    };

    async getInstance(id) {
        return await this.readJSON(await Neutralino.filesystem.getJoinedPath(this.instancesDir, id, "instance.json"));
    };

    async createInstance(id, repo, tag, exec, target) {
        const path = await Neutralino.filesystem.getJoinedPath(this.instancesDir, id);

        await this.ensureDir(path);
        await this.ensureDir(await Neutralino.filesystem.getJoinedPath(path, "content"));

        const instance = {
            id,
            repo,
            tag,
            exec,
            target,
            playtime: 0,
            ip: "",
            port: "",
            compatibilityLayer: "DIRECT",
            serverMode: false,
            fullscreen: false,
            assetId: null,
            installed: false
        };

        await this.writeJSON(await Neutralino.filesystem.getJoinedPath(path, "instance.json"), instance);
    };

    async deleteInstance(id) {
        await Neutralino.filesystem.remove(await Neutralino.filesystem.getJoinedPath(this.instancesDir, id));
    };

    //! builds
    async backupPreserved(instancePath) {
        const backupDir = await Neutralino.filesystem.getJoinedPath(instancePath, "backup");
        await this.ensureDir(backupDir);

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

            const release = await this.getRelease(instance.repo, instance.tag);
            if (!release) return showToast("Error: Release not found");

            if (!release.assets || release.assets.length === 0)
                return showToast("Error: No assets found in this release");

            const asset = instance.target
                ? release.assets.find(a => a.name === instance.target)
                : release.assets[0];
            if (!asset) return showToast("Error: Required asset not found in release");

            const instancePath = await Neutralino.filesystem.getJoinedPath(this.instancesDir, instance.id);
            const zipPath = await Neutralino.filesystem.getJoinedPath(instancePath, `${instance.target}.zip`);

            await this.ensureDir(instancePath);
            await this.ensureDir(await Neutralino.filesystem.getJoinedPath(instancePath, 'content'));

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

            await this.writeJSON(`${instancePath}/instance.json`, instance);
            console.log("Instance installed");
            showToast("Instance update completed");
        } catch (err) {
            console.error(err);
            showToast(`Error: ${err.message}`);

            try {
                await Neutralino.filesystem.remove(`${this.instancesDir}/${instance.id}/${instance.target}.zip`);
            } catch { }
        };
    };

    async needsUpdate(instance) {
        const release = await this.getRelease(instance.repo, instance.tag);
        if (!release) return false;

        const asset = instance.target
            ? release.assets.find(a => a.name === instance.target)
            : release.assets[0];
        return asset.id !== instance.assetId;
    };

    async writeSkin(instanceId, dataURI) {
        if (!dataURI) return;

        try {
            const response = await fetch(dataURI);
            const arrayBuffer = await response.arrayBuffer();

            const baseDir = `${this.instancesDir}/${instanceId}/content`;
            const filePath = `${baseDir}/Common/res/mob/char.png`;

            await this.ensureDir(`${baseDir}/Common/res/mob`);
            await Neutralino.filesystem.writeBinaryFile(filePath, arrayBuffer);
            console.log("Skin written to:", filePath);
        } catch (err) {
            console.error("Failed to write skin:", err);
            return showToast("Error: Skin couldn't be written to instance");
        };
    };

    async launchInstance(instanceId, profileId) {
        const instance = await this.getInstance(instanceId);
        if (!instance) return showToast("Error: Instance not found");

        const profile = await this.getProfile(profileId);
        if (!profile) return showToast("Error: Profile not found");

        if (!instance.installed) await this.installInstance(instance);
        if (!instance.installed) return;

        if (await this.needsUpdate(instance)) {
            console.log("Updating instance...");
            await this.installInstance(instance);
        };

        // save skin from datauri
        await this.writeSkin(instanceId, profile.skin);

        const cwd = await Neutralino.filesystem.getJoinedPath(this.instancesDir, instanceId, "content");
        const execPath = await Neutralino.filesystem.getJoinedPath(cwd, instance.exec);

        // write uid
        await Neutralino.filesystem.writeFile(await Neutralino.filesystem.getJoinedPath(cwd, "uid.dat"), `${profile.uid}\n`);

        // write servers.txt
        const servers = await this.listServers(instanceId);

        const content = servers
            .map(s => `${s.ip}\n${s.port}\n${s.name}`)
            .join("\n") + (servers.length ? "\n" : "");
        const path = await Neutralino.filesystem.getJoinedPath(
            this.instancesDir,
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
        if (instance.serverMode) args.push("-server");
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
                if (!(await this.cmdExists(bin))) return showToast(`Error: ${bin} is not installed`);

                cmd = `${bin} "${execPath}" ${joinedArgs}`;
            };

            if (compat === "PROTON") {
                if (!(await this.cmdExists("proton"))) return showToast(`Error: proton is not installed`);

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

        const instancePath = await Neutralino.filesystem.getJoinedPath(this.instancesDir, instanceId, "instance.json");
        const updatedInstance = await this.getInstance(instanceId);

        updatedInstance.playtime = (updatedInstance.playtime || 0) + sessionSeconds;
        await this.writeJSON(instancePath, updatedInstance);

        if (proc.exitCode !== 0 && duration < 2000) {
            showToast("Error: Failed to launch instance");
            console.error(proc.stdErr);
        };
    };
};