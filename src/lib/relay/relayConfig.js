export default class RelayConfig {
    static async update(newConfig = {}) {
        return await lib.run(null, 'relayConfig', 'update', newConfig);
    };

    static async toJSON() {
        return await lib.run(null, 'relayConfig', 'toJSON');
    };
};