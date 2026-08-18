Neutralino.events.on('hostReady', (event) => {
    const state = event.detail;
    vlanRelay.emit("hostReady", state);
});

export default class vlanRelay {
    static listeners = {};

    static on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    };

    static off(event, callback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };

    static once(event, callback) {
        const wrapper = (data) => {
            callback(data);
            this.off(event, wrapper);
        };
        this.on(event, wrapper);
    };

    static emit(event, data) {
        if (!this.listeners[event]) return;
        [...this.listeners[event]].forEach(callback => callback(data));
    };


    static async start(config) {
        return await lib.run(null, 'vlanRelay', 'start', config);
    };

    static async stop() {
        return await lib.run(null, 'vlanRelay', 'stop');
    };
};