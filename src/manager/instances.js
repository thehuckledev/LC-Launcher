import Neutralino from "@neutralinojs/lib";

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

    async create(repo, tag, exec, target) {
        const path = await Neutralino.filesystem.getJoinedPath(this.manager.instancesDir, id);

        await this.manager.utils.ensureDir(path);
        await this.manager.utils.ensureDir(await Neutralino.filesystem.getJoinedPath(path, "content"));

        const instance = {
            id: crypto.randomUUID(),
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

        await this.manager.utils.writeJSON(await Neutralino.filesystem.getJoinedPath(path, "instance.json"), instance);

        return instance;
    };

    async delete(id) {
        try {
            await Neutralino.filesystem.remove(await Neutralino.filesystem.getJoinedPath(this.manager.instancesDir, id));
        } catch {
            return;
        };
    };
};