import Neutralino from "@neutralinojs/lib";
import { showToast } from "../components/Toast";

export class Worlds {
    constructor(manager) {
        this.manager = manager;
    };

    async list(instanceId) {
        const dir = await Neutralino.filesystem.getJoinedPath(this.manager.instancesDir, instanceId, "content", "Windows64", "GameHDD");

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

    async import(instanceId) {
        const worldsDir = await Neutralino.filesystem.getJoinedPath(this.manager.instancesDir, instanceId, "content", "Windows64", "GameHDD");
        await this.manager.utils.ensureDir(worldsDir);

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

    async export(instanceId, worldId) {
        const worldsDir = await Neutralino.filesystem.getJoinedPath(this.manager.instancesDir, instanceId, "content", "Windows64", "GameHDD");
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

    async delete(instanceId, worldId) {
        const worldsDir = await Neutralino.filesystem.getJoinedPath(this.manager.instancesDir, instanceId, "content", "Windows64", "GameHDD");
        const worldPath = await Neutralino.filesystem.getJoinedPath(worldsDir, worldId);

        try {
            await Neutralino.filesystem.remove(worldPath);
            showToast("World deleted");
        } catch {
            showToast("Error: Couldn't delete world");
        };
    };
};