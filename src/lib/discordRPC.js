let isSetup = false;
export default class DiscordRPC {
    static async init(clientId) {
        const res = await lib.run(null, 'discordRPC', 'init', clientId);
        if (!!res) isSetup = true;
        return res;
    };

    static async enable() {
        if (!isSetup) return false;
        return await lib.run(null, 'discordRPC', 'enable');
    };

    static async disable() {
        if (!isSetup) return false;
        return await lib.run(null, 'discordRPC', 'disable');
    };

    static async edit(config) {
        if (!isSetup) return false;
        return await lib.run(null, 'discordRPC', 'edit', config);
    };
};