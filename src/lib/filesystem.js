import Neutralino from "@neutralinojs/lib";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

    static async writeStream(targetPath, rawData, delayMs = 10) {
        const streamID = crypto.randomUUID();
        const jsonString = typeof rawData === "string" ? rawData : JSON.stringify(rawData, null, 2);
        const CHUNK_SIZE = 32 * 1024; // 32 kb
        
        await Filesystem.writeStreamStart(streamID, targetPath, false);
        await sleep(15);

        let offset = 0;
        while (offset < jsonString.length) {
            const chunk = jsonString.slice(offset, offset + CHUNK_SIZE);
            await Filesystem.writeStreamChunk(streamID, chunk, false);
            offset += CHUNK_SIZE;

            if (offset < jsonString.length && delayMs > 0) await sleep(delayMs);
        };

        await sleep(15);
        return await Filesystem.writeStreamEnd(streamID);
    };

    static async readStream(targetPath, chunkSize = 32 * 1024, asBase64 = false, delayMs = 10) {
        const callID = crypto.randomUUID();

        return new Promise(async (resolve, reject) => {
            let fileContent = "";

            const onChunkReceived = (event) => {
                const payload = event.detail;
                if (payload.callID === callID) fileContent += payload.data;
            };

            const onStreamEnd = async (event) => {
                const payload = event.detail;
                if (payload.callID === callID) {
                    await Neutralino.events.off('readStreamChunk', onChunkReceived);
                    await Neutralino.events.off('readStreamEnd', onStreamEnd);

                    resolve(fileContent);
                };
            };

            await Neutralino.events.on('readStreamChunk', onChunkReceived);
            await Neutralino.events.on('readStreamEnd', onStreamEnd);

            try {
                await lib.run(callID, 'filesystem', 'readStream', {
                    targetPath,
                    chunkSize,
                    asBase64,
                    delayMs
                });
            } catch (err) {
                await Neutralino.events.off('readStreamChunk', onChunkReceived);
                await Neutralino.events.off('readStreamEnd', onStreamEnd);
                reject(err);
            };
        });
    };
};