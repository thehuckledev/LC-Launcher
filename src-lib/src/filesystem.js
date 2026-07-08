const fs = require('node:fs');
const path = require('node:path');
const fflate = require('fflate');
const tarStream = require('tar-stream');
const { XzReadableStream } = require("xz-decompress");

const activeWriteStreams = new Map();

class Filesystem {
    static async writeStreamStart(callID, ext, config) {
        const { streamID, targetPath, append = false } = config;

        fs.mkdirSync(path.dirname(targetPath), { recursive: true });

        const writeStream = fs.createWriteStream(targetPath, { flags: append ? 'a' : 'w' });

        activeWriteStreams.set(streamID, writeStream);
        return { success: true, streamID };
    };

    static async writeStreamChunk(callID, ext, config) {
        const { streamID, data, isBase64 = false } = config;

        const stream = activeWriteStreams.get(streamID);
        if (!stream) throw new Error(`Stream not found: ${streamID}`);

        return new Promise((resolve, reject) => {
            const buffer = isBase64 ? Buffer.from(data, 'base64') : data;

            const cacheDrained = stream.write(buffer, (err) => {
                if (err) return reject(new Error(`Write chunk error: ${err.message}`));
                if (cacheDrained) resolve({ success: true });
            });

            if (!cacheDrained) stream.once('drain', () => resolve({ success: true }));
        });
    };

    static async writeStreamEnd(callID, ext, config) {
        const { streamID } = config;

        const stream = activeWriteStreams.get(streamID);
        if (!stream) throw new Error(`Stream not found: ${streamID}`);

        return new Promise((resolve) => {
            stream.end(() => {
                activeWriteStreams.delete(streamID);
                resolve({ success: true });
            });
        });
    };

    static async unzip(callID, ext, config) {
        const { zipPath, destPath } = config;

        if (!fs.existsSync(zipPath)) throw new Error(`Archive not found: ${zipPath}`);
        if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });

        const lowerPath = zipPath.toLowerCase();
        if (lowerPath.endsWith('.tar.xz'))
            await Filesystem._extractTarXz(callID, ext, zipPath, destPath);
        else if (lowerPath.endsWith('.tar.gz') || lowerPath.endsWith('.tgz'))
            await Filesystem._extractTarGz(callID, ext, zipPath, destPath);
        else
            await Filesystem._extractZip(callID, ext, zipPath, destPath);

        const entries = fs.readdirSync(destPath).filter(e => e !== '.' && e !== '..' && e !== '.DS_Store');
        if (entries.length === 1) {
            const rootDirName = entries[0];
            const rootDirPath = path.join(destPath, rootDirName);

            if (fs.statSync(rootDirPath).isDirectory()) {
                const rootFiles = fs.readdirSync(rootDirPath);

                for (const file of rootFiles) {
                    const srcPath = path.join(rootDirPath, file);
                    const finalDestPath = path.join(destPath, file);
                    
                    fs.renameSync(srcPath, finalDestPath);
                };

                fs.rmdirSync(rootDirPath);
            };
        };

        return { success: true, destPath };
    };

    static async _extractZip(callID, ext, zipPath, destPath) {
        const zipBuffer = new Uint8Array(await Bun.file(zipPath).arrayBuffer());

        const unzipped = fflate.unzipSync(zipBuffer);
        const files = Object.keys(unzipped);
        const totalFiles = files.length;

        if (totalFiles === 0) throw new Error("Zip archive is empty");

        let extractedCount = 0;
        for (const filename of files) {
            const fileData = unzipped[filename];
            const targetFilePath = path.join(destPath, filename);

            if (filename.endsWith('/') || filename.endsWith('\\')) {
                fs.mkdirSync(targetFilePath, { recursive: true });
                extractedCount++;
                continue;
            };

            fs.mkdirSync(path.dirname(targetFilePath), { recursive: true });
            await Bun.write(targetFilePath, fileData);

            extractedCount++;
            ext.sendMessage('unzipProgress', {
                callID,
                percent: Math.floor((extractedCount / totalFiles) * 100)
            });
        };
    };

    static async _extractTarGz(callID, ext, zipPath, destPath) {
        const compressedBuffer = new Uint8Array(await Bun.file(zipPath).arrayBuffer());
        const tarBuffer = Bun.gunzipSync(compressedBuffer);
        
        await Filesystem._streamTarBuffer(callID, ext, tarBuffer, destPath);
    };

    static async _extractTarXz(callID, ext, zipPath, destPath) {
        const compressedFile = Bun.file(zipPath);
        const compressedStream = compressedFile.stream();

        const decompressedStream = new XzReadableStream(compressedStream);
        const response = new Response(decompressedStream);

        const arrBuff = await response.arrayBuffer();
        const tarBuffer = new Uint8Array(arrBuff);

        await Filesystem._streamTarBuffer(callID, ext, tarBuffer, destPath);
    };

    static _streamTarBuffer(callID, ext, tarBuffer, destPath) {
        return new Promise((resolve, reject) => {
            const extract = tarStream.extract();
            
            const totalBytes = tarBuffer.length;
            let totalProcessedBytes = 0;

            extract.on('entry', async (header, stream, next) => {
                const targetFilePath = path.resolve(destPath, header.name);
                if (!targetFilePath.startsWith(path.resolve(destPath))) throw new Error(`Illegal archive path: ${header.name}`);
                
                totalProcessedBytes += 512 + Math.ceil(header.size / 512) * 512;

                try {
                    if (header.type === 'directory') {
                        fs.mkdirSync(targetFilePath, {
                            recursive: true,
                            mode: header.mode || 0o755
                        });
                        stream.resume();
                        return next();
                    };

                    if (header.type === "symlink") {
                        fs.mkdirSync(path.dirname(targetFilePath), { recursive: true });
                        fs.symlinkSync(header.linkname, targetFilePath);

                        stream.resume();
                        return next();
                    };

                    if (header.type === "link") {
                        fs.mkdirSync(path.dirname(targetFilePath), { recursive: true });

                        const linkedPath = path.resolve(path.dirname(targetFilePath), header.linkname);
                        fs.linkSync(linkedPath, targetFilePath);

                        stream.resume();
                        return next();
                    };

                    if (header.type === "file" || header.type === "contiguous-file") {
                        fs.mkdirSync(path.dirname(targetFilePath), { recursive: true });

                        const chunks = [];
                        for await (const chunk of stream) chunks.push(chunk);
                        const fileData = Buffer.concat(chunks);

                        const fileMode = header.mode || 0o755;
                        await fs.promises.writeFile(targetFilePath, fileData, { mode: fileMode });
                        fs.chmodSync(targetFilePath, fileMode);

                        ext.sendMessage("unzipProgress", {
                            callID,
                            percent: Math.min(Math.floor((totalProcessedBytes / totalBytes) * 100), 99)
                        });

                        return next();
                    };

                    stream.resume();
                    next();
                } catch (err) {
                    reject(err);
                };
            });

            extract.on('finish', () => {
                ext.sendMessage('unzipProgress', { callID, percent: 100 });
                resolve();
            });
            extract.on('error', (err) => reject(err));
            extract.end(tarBuffer);
        });
    };

    static unlink(callID, ext, targetPath) {
        const stats = fs.lstatSync(targetPath, { throwIfNoEntry: false });
        if (stats) fs.rmSync(targetPath, { recursive: true, force: true });
    };

    static symlink(callID, ext, srcTarget, destPath) {
        if (process.platform === "win32") {
            const isDir = fs.existsSync(destPath) && fs.statSync(destPath).isDirectory();
            fs.symlinkSync(destPath, srcTarget, isDir ? "junction" : "file");
        } else {
            fs.symlinkSync(destPath, srcTarget);
        };
    };
};

process.on('exit', () => {
    for (const [id, stream] of activeWriteStreams.entries()) {
        try {
            stream.end();
        } catch {};
    };

    activeWriteStreams.clear();
});

module.exports = Filesystem;