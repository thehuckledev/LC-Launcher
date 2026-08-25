export default class UniversalControllerSupport {
    static async toggle(enable) {
        return await lib.run(null, 'universalControllerSupport', 'toggle', enable);
    };
};