class RelayConfig {
    static _serverSecure = false;
    static _serverBase = "127.0.0.1:4252";
    static _relayPort = 61000;
    static _hostRelayPort = 25565;

    static get serverSecure() {
        return this._serverSecure;
    };
    static set serverSecure(value) {
        this._serverSecure = Boolean(value);
    };

    static get serverBase() {
        return this._serverBase;
    };
    static set serverBase(value) {
        this._serverBase = value;
    };

    static get relayPort() {
        return this._relayPort;
    };
    static set relayPort(value) {
        const parsed = parseInt(value, 10);
        if (!isNaN(parsed)) this._relayPort = parsed;
    };

    static get hostRelayPort() {
        return this._hostRelayPort;
    };
    static set hostRelayPort(value) {
        const parsed = parseInt(value, 10);
        if (!isNaN(parsed)) this._hostRelayPort = parsed;
    };

    static get protocol() {
        return this._serverSecure ? "https" : "http";
    };

    static get wsProtocol() {
        return this._serverSecure ? "wss" : "ws";
    };

    static get wsBase() {
        return `${this.wsProtocol}://${this._serverBase}`;
    };

    static get apiBase() {
        return `${this.protocol}://${this._serverBase}/v1`;
    };

    static update(newConfig = {}) {
        if (newConfig.serverSecure !== undefined) this.serverSecure = newConfig.serverSecure;
        if (newConfig.serverBase !== undefined) this.serverBase = newConfig.serverBase;
        if (newConfig.relayPort !== undefined) this.relayPort = newConfig.relayPort;
        if (newConfig.hostRelayPort !== undefined) this.hostRelayPort = newConfig.hostRelayPort;
    };

    static toJSON() {
        return {
            relayPort: this.relayPort,
            hostRelayPort: this.hostRelayPort,
            wsBase: this.wsBase,
            apiBase: this.apiBase,
            serverBase: this.serverBase,
            serverSecure: this.serverSecure
        };
    };
};

module.exports = RelayConfig;