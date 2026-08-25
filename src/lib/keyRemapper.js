export default class KeyRemapper {
    static async start() {
        return await lib.run(null, 'keyRemapper', 'start');
    };

    static async stop() {
        return await lib.run(null, 'keyRemapper', 'stop');
    };

    static async getDefaultBindings() {
        return await lib.run(null, 'keyRemapper', 'getDefaultBindings');
    };

    static async getBindingsCatagories() {
        return await lib.run(null, 'keyRemapper', 'getBindingsCatagories');
    };

    static async getBindingsLabels() {
        return await lib.run(null, 'keyRemapper', 'getBindingsLabels');
    };

    static async isValidKey(key) {
        return await lib.run(null, 'keyRemapper', 'isValidKey', key);
    };

    static async getBindings() {
        return await lib.run(null, 'keyRemapper', 'getBindings');
    };

    static async setBinding(action, key) {
        return await lib.run(null, 'keyRemapper', 'setBinding', action, key);
    };

    static async setBindings(bindings) {
        return await lib.run(null, 'keyRemapper', 'setBindings', bindings);
    };
};