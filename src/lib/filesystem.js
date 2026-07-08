export default class Filesystem {
    static async symlink(path, target) {
        return await lib.run(null, 'filesystem', 'symlink', path, target);
    };

    static async unlink(path) {
        return await lib.run(null, 'filesystem', 'unlink', path);
    };

    static async unzip(zipPath, destPath, id) {
        return await lib.run(id, 'filesystem', 'unzip', {
            zipPath,
            destPath
        });
    };

    static async writeStreamStart(streamID, targetPath, append = false) {
        return await lib.run(null, 'filesystem', 'writeStreamStart', {
            streamID,
            targetPath,
            append
        });
    };

    static async writeStreamChunk(streamID, data, isBase64 = false) {
        return await lib.run(null, 'filesystem', 'writeStreamChunk', {
            streamID,
            data,
            isBase64
        });
    };

    static async writeStreamEnd(streamID) {
        return await lib.run(null, 'filesystem', 'writeStreamEnd', { streamID });
    };

    static async writeStream(targetPath, rawData) {
        const streamID = crypto.randomUUID();
        const jsonString = typeof rawData === "string" ? rawData : JSON.stringify(rawData, null, 2);
        const CHUNK_SIZE = 256 * 1024; // 256 kb
        
        await Filesystem.writeStreamStart(streamID, targetPath, false);

        let offset = 0;
        while (offset < jsonString.length) {
            const chunk = jsonString.slice(offset, offset + CHUNK_SIZE);
            await Filesystem.writeStreamChunk(streamID, chunk, false);
            offset += CHUNK_SIZE;
        };

        return await Filesystem.writeStreamEnd(streamID);
    };
};