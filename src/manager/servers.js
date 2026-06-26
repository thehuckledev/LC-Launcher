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

    async update(instanceId, serverId, updateData) {
        if (!updateData.name || !updateData.ip) throw new Error("Name and IP required");

        const path = await Neutralino.filesystem.getJoinedPath(
            this.manager.instancesDir,
            instanceId,
            "servers.json"
        );
        const servers = await this.list(instanceId);

        const i = servers.findIndex(s => s.id === serverId);
        if (i === -1) throw new Error("Server not found");
        
        servers[i] = {
            ...servers[i],
            name: updateData.name,
            ip: updateData.ip,
            port: updateData.port || "25565"
        };

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

    async join(instanceId, profileId, serverId) {
        const server = await this.get(instanceId, serverId);
        this.manager.exec.launch(instanceId, profileId, server.ip, server.port || "25565")
    };

    async write(instanceId) {
        const servers = await this.list(instanceId);
        const encoder = new TextEncoder();

        let totalSize = 12;
        
        const packedServers = servers.map(s => {
            const ipBytes = encoder.encode(s.ip);
            const nameBytes = encoder.encode(s.name);
            const portNum = parseInt(s.port, 10) || 25565;

            totalSize += 2 + ipBytes.length + 2 + 2 + nameBytes.length;

            return { ipBytes, nameBytes, portNum };
        });

        const buffer = new ArrayBuffer(totalSize);
        const view = new DataView(buffer);
        const uint8 = new Uint8Array(buffer);

        uint8.set([77, 67, 83, 86], 0);
        view.setUint32(4, 1, true);
        view.setUint32(8, packedServers.length, true);

        let offset = 12;
        for (const s of packedServers) {
            // ip
            view.setUint16(offset, s.ipBytes.length, true);
            offset += 2;
            uint8.set(s.ipBytes, offset);
            offset += s.ipBytes.length;

            // port
            view.setUint16(offset, s.portNum, true);
            offset += 2;

            // name
            view.setUint16(offset, s.nameBytes.length, true);
            offset += 2;
            uint8.set(s.nameBytes, offset);
            offset += s.nameBytes.length;
        };

        const dbPath = await Neutralino.filesystem.getJoinedPath(
            this.manager.instancesDir,
            instanceId,
            "content",
            "servers.db"
        );

        await Neutralino.filesystem.writeBinaryFile(dbPath, buffer);
        console.log("Servers written to:", dbPath, buffer);
    };

    async read(instanceId) {
        const dbPath = await Neutralino.filesystem.getJoinedPath(
            this.manager.instancesDir,
            instanceId,
            "content",
            "servers.db"
        );

        let buffer;
        try {
            buffer = await Neutralino.filesystem.readBinaryFile(dbPath);
        } catch (e) {
            return console.error(e);
        };

        const view = new DataView(buffer);
        const uint8 = new Uint8Array(buffer);
        const decoder = new TextDecoder("utf-8");

        if (buffer.byteLength < 12 || uint8[0] !== 77 || uint8[1] !== 67 || uint8[2] !== 83 || uint8[3] !== 86) return;

        const version = view.getUint32(4, true);
        const serverCount = view.getUint32(8, true);

        let offset = 12;
        const parsedServers = [];

        for (let i = 0; i < serverCount; i++) {
            if (offset + 2 > buffer.byteLength) break;
            
            // ip len and ip
            const ipLen = view.getUint16(offset, true);
            offset += 2;
            if (offset + ipLen > buffer.byteLength) break;
            const ip = decoder.decode(uint8.subarray(offset, offset + ipLen));
            offset += ipLen;

            // port
            if (offset + 2 > buffer.byteLength) break;
            const port = view.getUint16(offset, true).toString();
            offset += 2;

            // name length and name
            if (offset + 2 > buffer.byteLength) break;
            const nameLen = view.getUint16(offset, true);
            offset += 2;
            if (offset + nameLen > buffer.byteLength) break;
            const name = decoder.decode(uint8.subarray(offset, offset + nameLen));
            offset += nameLen;

            parsedServers.push({
                id: crypto.randomUUID(),
                name,
                ip,
                port
            });
        };

        const jsonPath = await Neutralino.filesystem.getJoinedPath(
            this.manager.instancesDir,
            instanceId,
            "servers.json"
        );

        await Neutralino.filesystem.writeFile(jsonPath, JSON.stringify(parsedServers, null, 2));
        console.log("Servers saved to:", jsonPath, parsedServers);
    };
};