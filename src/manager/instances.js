import Neutralino from "@neutralinojs/lib";
import { showToast } from "../components/Toast.jsx";

export class Instances {
    constructor(manager) {
        this.manager = manager;
    };

    async list() {
        const list = await Neutralino.filesystem.readDirectory(this.manager.instancesDir);

        return list
            .filter(e => e.type === "DIRECTORY")
            .map(e => e.entry);
    };

    async get(id) {
        try {
            return await this.manager.utils.readJSON(await Neutralino.filesystem.getJoinedPath(this.manager.instancesDir, id, "instance.json"));
        } catch {
            return;
        };
    };

    async create(id = crypto.randomUUID(), data = {}) {
        const path = await Neutralino.filesystem.getJoinedPath(this.manager.instancesDir, id);

        await this.manager.utils.ensureDir(path);
        await this.manager.utils.ensureDir(await Neutralino.filesystem.getJoinedPath(path, "content"));

        if (data.serviceType && !["GITHUB","GITLAB","GITEA"].includes(data.serviceType)) return new Error("serviceType isn't supported yet. Only GITHUB,GITLAB,GITEA are supported at the moment.");
        if (data.compatibilityLayer === "RUNTIME") data.compatibilityLayer = (NL_OS === "Darwin") ? "WINE64" : "PROTON";

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
            fullscreen: false,
            assetId: null,
            installed: false,
            customArgs: "",
            ...data,
            id,
        };

        await this.manager.utils.writeJSON(await Neutralino.filesystem.getJoinedPath(path, "instance.json"), instance);

        return instance;
    };

    async update(id, data) {
        try {
            const instancePath = await Neutralino.filesystem.getJoinedPath(this.manager.instancesDir, id, "instance.json");
            const currentData = await this.get(id);
            if (!currentData) throw new Error("Instance not found");

            if (data.serviceType && !["GITHUB","GITLAB","GITEA"].includes(data.serviceType)) return new Error("serviceType isn't supported yet. Only GITHUB,GITLAB,GITEA are supported at the moment.");
            if (data.compatibilityLayer === "RUNTIME") data.compatibilityLayer = (NL_OS === "Darwin") ? "WINE64" : "PROTON";

            const updatedData = {
                ...currentData,
                ...data,
                id,
            };

            await this.manager.utils.writeJSON(instancePath, updatedData);
            return updatedData;
        } catch (err) {
            console.error(`Failed to update instance ${id}:`, err);
            return null;
        };
    };

    async delete(id) {
        try {
            await Neutralino.filesystem.remove(await Neutralino.filesystem.getJoinedPath(this.manager.instancesDir, id));
        } catch {
            return;
        };
    };

    async openFolder(id) {
        let cmd = `start ""`;
        if (NL_OS === "Linux") cmd = "xdg-open";
        if (NL_OS === "Darwin") cmd = "open";
        const instPath = await Neutralino.filesystem.getJoinedPath(this.manager.instancesDir, id);
        await Neutralino.os.execCommand(`${cmd} "${instPath}"`)
    };

    async export(id) {
        const data = await this.get(id);
        if (!data) throw new Error("ID isn't valid");

        const sterilisedData = {
            ...data,
            playtime: 0,
            assetId: null,
            installed: false,
        };

        const savePath = await Neutralino.os.showSaveDialog("Export Instance Config ( Must use .lceinstance.json )", {
            filters: [{ name: 'LCE Instance Files', extensions: ['lceinstance.json'] }],
            defaultPath: NL_OS === "Darwin" ? undefined : `${id}.lceinstance.json`
        });
        if (!savePath) return;
        const saveFinal = savePath.trim();
        if (!saveFinal.endsWith(".lceinstance.json")) return showToast("You must save as a .lceinstance.json file");

        if (saveFinal) {
            await this.manager.utils.writeJSON(saveFinal, sterilisedData);
            return true;
        };
        return false;
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

            const regex = /^((?!-))(xn--)?[a-z0-9][a-z0-9-_]{0,61}[a-z0-9]{0,1}\.(xn--)?([a-z0-9\-]{1,61}|[a-z0-9-]{1,30}\.[a-z]{2,})$/gm;
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
                fullscreen: false,
                customArgs: "",
                ...data,
                id,
                playtime: 0,
                installed: false,
                assetId: null,
            };

            const inst = await this.create(id, instanceData);
            showToast(`Imported ${inst.name}`);
            return await inst;
        } catch (err) {
            console.error("Import failed:", err);
            throw err;
        };
    };
};