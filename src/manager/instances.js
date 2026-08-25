import Neutralino from "@neutralinojs/lib";
import { showToast } from "../components/Toast.jsx";
import { showAlert } from "../components/Alert.jsx";

import Filesystem from "../lib/filesystem.js";

export class Instances {
    constructor(manager) {
        this.manager = manager;
        this._instancesCache = new Map();
        this._listCache = null;
    };

    invalidateCache(id = null) {
        this._listCache = null;
        if (id) this._instancesCache.delete(id);
        else this._instancesCache.clear();
    };

    async list(forceRefresh = false) {
        if (!forceRefresh && this._listCache !== null) return this._listCache;

        try {
            const list = await Neutralino.filesystem.readDirectory(this.manager.instancesDir);
            const validInstances = [];

            for (const e of list) {
                if (e.type !== "DIRECTORY") continue;

                const jsonPath = `${this.manager.instancesDir}/${e.entry}/instance.json`;
                try {
                    await Neutralino.filesystem.getStats(jsonPath);
                    validInstances.push(e.entry);
                } catch (err) {};
            };

            this._listCache = validInstances;
            return validInstances;
        } catch (err) {
            console.error("Error listing instances:", err);
            return [];
        };
    };

    async get(id, forceRefresh = false) {
        if (!id) return null;
        if (!forceRefresh && this._instancesCache.has(id)) return this._instancesCache.get(id);

        try {
            // reading in chunks to fix linux webkitgtk issue where it cant read more than about 2mb due to the websocket message size limit
            //return await this.manager.utils.readJSON(await Neutralino.filesystem.getJoinedPath(this.manager.instancesDir, id, "instance.json"));
            const targetPath = await Neutralino.filesystem.getJoinedPath(this.manager.instancesDir, id, "instance.json");
            const instanceContent = await Filesystem.readStream(targetPath);

            console.log(`Instance ${id} fetched with content ${instanceContent?.length || "0"}`);

            if (!instanceContent) throw new Error("File not readable");
            
            const parsed = JSON.parse(instanceContent);
            this._instancesCache.set(id, parsed);
            return parsed;
        } catch(e) {
            console.error(`Error fetching instance ${id}`, e);
            return null;
        };
    };

    async create(id = crypto.randomUUID(), data = {}) {
        const path = await Neutralino.filesystem.getJoinedPath(this.manager.instancesDir, id);

        await this.manager.utils.ensureDir(path);
        if (data.serviceType !== "LOCAL") await this.manager.utils.ensureDir(await Neutralino.filesystem.getJoinedPath(path, "content"));

        if (data.serviceType && !["GITHUB", "GITLAB", "GITEA", "URL", "LOCAL"].includes(data.serviceType)) return new Error("serviceType isn't supported yet. Only GITHUB,GITLAB,GITEA are supported at the moment.");

        const instance = {
            icon: undefined,
            background: undefined,
            logo: undefined,
            name: data.repo,
            serviceType: "GITHUB",
            serviceDomain: "github.com",
            playtime: 0,
            ip: "",
            port: "",
            compatibilityLayer: "DIRECT",
            supportsSlimSkins: false,
            supports64x64Skins: false,
            fullscreen: false,
            quitOnDisconnect: false,
            assetId: null,
            installed: false,
            customArgs: "",
            ...data,
            id,
        };

        const instancePath = await Neutralino.filesystem.getJoinedPath(path, "instance.json");
        await Filesystem.writeStream(instancePath, instance);

        this._instancesCache.set(id, instance);
        this.invalidateCache();

        return instance;
    };

    async update(id, data) {
        try {
            const instancePath = await Neutralino.filesystem.getJoinedPath(this.manager.instancesDir, id, "instance.json");
            const currentData = await this.get(id);
            if (!currentData) throw new Error("Instance not found");

            if (data.serviceType && !["GITHUB", "GITLAB", "GITEA", "URL", "LOCAL"].includes(data.serviceType)) return new Error("serviceType isn't supported yet. Only GITHUB,GITLAB,GITEA are supported at the moment.");

            const dataDiff = {
                ...data,
                id,
            };
            const updatedData = {
                ...currentData,
                ...dataDiff
            };

            await Filesystem.writeJSONStream(instancePath, dataDiff);

            this._instancesCache.set(id, updatedData);
            this.invalidateCache();

            return updatedData;
        } catch (err) {
            console.error(`Failed to update instance ${id}:`, err);
            return null;
        };
    };

    async delete(id) {
        try {
            window.dispatchEvent(new CustomEvent("execProcessing", { detail: true }));
            const instance = await this.get(id);
            if (!instance) return;

            let keepInList = "NO";
            if (instance.serviceType !== "LOCAL") {
                keepInList = await showAlert('Delete Instance', `Do you want to remove the "${instance.name}" instance from your instances list once deleted?`, 'YES_NO');
            };
            
            // delete bit
            await this.manager.profiles.removeInstanceFiles(id);

            const instancePath = await Neutralino.filesystem.getJoinedPath(this.manager.instancesDir, instance.id);
            const contentDir = `${instancePath}/content`;

            if (keepInList === "YES" || instance.serviceType === "LOCAL") {
                await Neutralino.filesystem.remove(instancePath);
            } else {
                await this.update(id, { installed: false });
                await Neutralino.filesystem.remove(contentDir);
            };
        } catch(e) {
            console.error("Delete failed:", e);
        } finally {
            window.dispatchEvent(new CustomEvent("execProcessing", { detail: false }));
            this.invalidateCache(id);
        };
    };

    getOSCommand(targetPath) {
        let cmd = `start ""`;
        if (NL_OS === "Linux") cmd = "xdg-open";
        if (NL_OS === "Darwin") cmd = "open";
        return `${cmd} "${targetPath}"`;
    };

    async openFolder(id) {
        const instPath = await Neutralino.filesystem.getJoinedPath(this.manager.instancesDir, id);
        await Neutralino.os.execCommand(this.getOSCommand(instPath));
    };

    async export(id) {
        const data = await this.get(id);
        if (!data) throw new Error("ID isn't valid");

        const sterilisedData = {
            ...data,
            playtime: 0,
            playtimeSessions: [],
            assetId: null,
            installed: false,
        };

        const savePath = await Neutralino.os.showSaveDialog("Export Instance Config ( Must use .lceinstance.json )", {
            filters: [{ name: 'LCE Instance Files', extensions: ['lceinstance.json'] }],
            defaultPath: NL_OS === "Darwin" ? undefined : `${id}.lceinstance.json`
        });
        if (!savePath) return false;
        const saveFinal = savePath.trim();
        if (!saveFinal.endsWith(".lceinstance.json")) return showToast("You must save as a .lceinstance.json file");

        await this.manager.utils.writeJSON(saveFinal, sterilisedData);
        return true;
    };

    async import(jsonStr) {
        try {
            let data;
            try {
                data = JSON.parse(jsonStr);
            } catch (e) {
                showToast("The file you dropped is not a valid JSON document");
                throw new Error("The file is not a valid JSON document.");
            };

            const required = {
                name: "string",
                repo: "string",
                target: "string",
                serviceType: [ "GITHUB", "GITLAB", "GITEA" ],
                serviceDomain: "string",
                compatibilityLayer: [ "RUNTIME", "DIRECT", "WINE", "WINE64", "PROTON" ]
            };

            for (const [field, type] of Object.entries(required)) {
                if (
                    (!data[field] || typeof data[field] !== type) &&
                    !(Array.isArray(type) && type.includes(data[field]))
                ) {
                    showToast(`Invalid or missing required field: ${field}`);
                    throw new Error(`Invalid or missing required field: ${field}`);
                };
            };

            const regex = /^((?!-))(xn--)?[a-z0-9][a-z0-9-_]{0,61}[a-z0-9]{0,1}\.(xn--)?([a-z0-9\-]{1,61}|[a-z0-9-]{1,30}\.[a-z]{2,})$/i;
            if (regex.exec(data.serviceDomain) === null) {
                showToast(`Invalid field: serviceDomain`);
                throw new Error(`Invalid field: serviceDomain`);
            };
            if (data.compatibilityLayer === "RUNTIME") data.compatibilityLayer = (NL_OS === "Darwin") ? "WINE64" : "PROTON";

            const sanatisedID = data?.id?.replace(/^-+|-+$|[^a-z0-9-]+/g, "");
            const id = sanatisedID || crypto.randomUUID();
            if (await this.get(id)) {
                showToast(`Instance with same ID already exists`);
                throw new Error(`Instance with same ID already exists`);
            };
            const instanceData = {
                icon: undefined,
                background: undefined,
                logo: undefined,
                name: data.repo,
                serviceType: "GITHUB",
                serviceDomain: "github.com",
                ip: "",
                port: "",
                compatibilityLayer: "DIRECT",
                supportsSlimSkins: false,
                supports64x64Skins: false,
                fullscreen: false,
                quitOnDisconnect: false,
                customArgs: "",
                ...data,
                id,
                playtime: 0,
                playtimeSessions: [],
                installed: false,
                assetId: null,
            };

            const inst = await this.create(id, instanceData);
            showToast(`Imported ${inst.name}`);
            return inst;
        } catch (err) {
            console.error("Import failed:", err);
            throw err;
        };
    };

    async reinstall(id) {
        try {
            window.dispatchEvent(new CustomEvent("execProcessing", { detail: true }));
            const instance = await this.get(id);
            if (!instance) return;

            let keepData = "NO";
            if (instance.serviceType !== "LOCAL") {
                keepData = await showAlert('Reinstall Instance', `Do you want to keep your game data when reinstalling "${instance.name}" instance?`, 'YES_NO');
            };
            
            // reinstall bit
            await this.update(id, { installed: false });
            await this.manager.exec.installInstance(instance, false, keepData === "YES");
        } catch(e) {
            console.error("Reinstall failed:", e);
        } finally {
            window.dispatchEvent(new CustomEvent("execProcessing", { detail: false }));
        };
    };

    async getScreenshots(id) {
        const screenshotPaths = [
            await Neutralino.filesystem.getJoinedPath(this.manager.instancesDir, id, "content/screenshots"),
            await Neutralino.filesystem.getJoinedPath(this.manager.instancesDir, id, "content/Windows64/GameHDD")
        ];

        const results = [];
        for (const screenshotPath of screenshotPaths) {
            try {
                const stats = await Neutralino.filesystem.getStats(screenshotPath);
                if (!stats.isDirectory) continue; 
                
                const entries = await Neutralino.filesystem.readDirectory(screenshotPath);
                const screenshotObj = entries.flatMap(e => {
                    if (e.type !== 'FILE' || !e.entry.endsWith('.png')) return [];

                    const dashDateAndTimeParts = e.entry.split("_");
                    if (dashDateAndTimeParts.length < 2) return [];

                    const [datePart, timePart] = dashDateAndTimeParts;
                    const dashDateParts = datePart.split("-");
                    if (dashDateParts.length < 3) return [];

                    const [YYYY, MM, DD] = dashDateParts;
                    const dashDate = `${DD}/${MM}/${YYYY}`;
                    
                    const strippedTime = timePart.replace(".png", "").replaceAll(".", ":");
                    const dashDateAndTime = `${dashDate} at ${strippedTime}`;

                    return [{
                        name: e.entry,
                        date: dashDate,
                        dateAndTime: dashDateAndTime,
                        path: `${screenshotPath}/${e.entry}`
                    }];
                });

                results.push(...screenshotObj);
            } catch (e) {
                continue; 
            };
        };

        return results;
    };

    async openScreenshot(path) {
        await Neutralino.os.execCommand(this.getOSCommand(path));
    };

    async openScreenshotsFolder(path) {
        const { parentPath } = await Neutralino.filesystem.getPathParts(path, "../");
        await Neutralino.os.execCommand(this.getOSCommand(parentPath));
    };

    async deleteScreenshot(name, path) {
        const confirmDelete = await showAlert('Delete Screenshot', `Are you sure you want to delete "${name}" screenshot?`, 'YES_NO');
        if (confirmDelete !== "YES") return false;

        try {
            await Neutralino.filesystem.remove(path);
            return true;
        } catch (err) {
            showToast("Failed to delete screenshot: " + err.message);
            return false;
        };
    };
};