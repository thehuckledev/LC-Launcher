import Neutralino from "@neutralinojs/lib";

export class Servers {
    constructor(manager) {
        this.manager = manager;
    };

    async list(instanceId) {
        const path = await Neutralino.filesystem.getJoinedPath(
            this.manager.instancesDir,
            instanceId,
            "servers.json"
        );

        try { return JSON.parse(await Neutralino.filesystem.readFile(path)); }
        catch { return []; };
    };

    async get(instanceId, id) {
        const servers = await this.list(instanceId);
        return servers.find(s => s.id === id) ?? null;
    };

    async add(instanceId, name, ip, port = "25565") {
        if (!name || !ip) throw new Error("Name and IP required");

        const path = await Neutralino.filesystem.getJoinedPath(
            this.manager.instancesDir,
            instanceId,
            "servers.json"
        );
        const servers = await this.list(instanceId);

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

    async remove(instanceId, id) {
        const path = await Neutralino.filesystem.getJoinedPath(
            this.manager.instancesDir,
            instanceId,
            "servers.json"
        );
        const servers = await this.list(instanceId);

        const filtered = servers.filter(s => s.id !== id);
        if (filtered.length === servers.length) return false;

        await Neutralino.filesystem.writeFile(path, JSON.stringify(filtered, null, 2));
        return true;
    };
};