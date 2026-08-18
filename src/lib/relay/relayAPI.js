Neutralino.events.on('relayAPISocket', (event) => {
    const detail = event.detail;
    if (!detail?.event) return;

    relayAPI.emit(detail?.event, detail?.data);
});

export default class relayAPI {
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


    static async exit(roomCode) {
        return await lib.run(null, 'relayAPI', 'exit', roomCode);
    };

    static async loadSession() {
        return await lib.run(null, 'relayAPI', 'loadSession');
    };

    static async ping() {
        return await lib.run(null, 'relayAPI', 'ping');
    };

    // auth
    static async login(username, password) {
        return await lib.run(null, 'relayAPI', 'login', username, password);
    };

    static async signup(username, password) {
        return await lib.run(null, 'relayAPI', 'signup', username, password);
    };

    static async logout() {
        return await lib.run(null, 'relayAPI', 'logout');
    };

    // rooms
    static async joinRoom(code) {
        return await lib.run(null, 'relayAPI', 'joinRoom', code);
    };

    static async createRoom(settings) {
        return await lib.run(null, 'relayAPI', 'createRoom', settings);
    };

    static async kickPlayer(code, targetID) {
        return await lib.run(null, 'relayAPI', 'kickPlayer', code, targetID);
    };

    static async banPlayer(code, targetID) {
        return await lib.run(null, 'relayAPI', 'banPlayer', code, targetID);
    };

    static async leaveRoom(code) {
        return await lib.run(null, 'relayAPI', 'leaveRoom', code);
    };

    // friends
    static async friends() {
        return await lib.run(null, 'relayAPI', 'friends');
    };

    static async friendRequests() {
        return await lib.run(null, 'relayAPI', 'friendRequests');
    };

    static async addFriend(username) {
        return await lib.run(null, 'relayAPI', 'addFriend', username);
    };

    static async acceptRequest(id) {
        return await lib.run(null, 'relayAPI', 'acceptRequest', id);
    };

    static async declineRequest(friendID, requestID) {
        return await lib.run(null, 'relayAPI', 'declineRequest', friendID, requestID);
    };

    static async cancelRequest(friendID, requestID) {
        return await lib.run(null, 'relayAPI', 'cancelRequest', friendID, requestID);
    };

    static async removeFriend(friendID, requestID) {
        return await lib.run(null, 'relayAPI', 'removeFriend', friendID, requestID);
    };

    static async updateStatus(status) {
        return await lib.run(null, 'relayAPI', 'updateStatus', status);
    };

    // invites
    static async invite(id) {
        return await lib.run(null, 'relayAPI', 'invite', id);
    };

    static async invites() {
        return await lib.run(null, 'relayAPI', 'invites');
    };

    static async acceptInvite(id) {
        return await lib.run(null, 'relayAPI', 'acceptInvite', id);
    };
    
    static async declineInvite(id) {
        return await lib.run(null, 'relayAPI', 'declineInvite', id);
    };
};