import Neutralino from "@neutralinojs/lib";

export class Utils {
    constructor(manager) {
        this.manager = manager;
    };

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
};