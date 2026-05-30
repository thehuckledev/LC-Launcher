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
};