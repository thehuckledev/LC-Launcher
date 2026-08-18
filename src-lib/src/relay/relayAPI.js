const fs = require('fs');
const os = require('os');
const path = require('path');
const EventEmitter = require('events');
const { io } = require("socket.io-client");

const { wsBase, apiBase } = require("./relayConfig");

const sessionPath = Bun.isStandaloneExecutable
                    ? path.join(path.dirname(process.execPath), '../data/lc-relay-session.json')
                    : path.join(__dirname, '../../.lc-relay-session.json');

class RelayAPI {
    static sessionPath = sessionPath;

    static token = "";
    static user = null;
    static socket = null;
    static eventEmitter = new EventEmitter();

    static on(event, listener) {
        this.eventEmitter.on(event, listener);
    };

    static once(event, listener) {
        this.eventEmitter.once(event, listener);
    };

    static off(event, listener) {
        this.eventEmitter.off(event, listener);
    };

    static initSocket(ext) {
        return new Promise((resolve) => {
            if (this.socket) {
                this.socket.removeAllListeners();
                this.socket.disconnect();
            };

            this.socket = io(wsBase, {
                transports: ["websocket"],
                auth: { token: this.token },
                reconnection: false
            });

            this.socket.on("connect", () => {
                this.eventEmitter.emit("connected");
                ext.sendMessage('relayAPISocket', {
                    event: "connected"
                });
                resolve(true);
            });

            this.socket.on("connect_error", (err) => {
                this.eventEmitter.emit("connect_error");
                ext.sendMessage('relayAPISocket', {
                    event: "connect_error"
                });
            });

            this.socket.on("player_joined", (player) => {
                const formattedPlayer = {
                    ...player,
                    isMe: player.id === this.user?.id
                };
                this.eventEmitter.emit("player_joined", formattedPlayer);
                ext.sendMessage('relayAPISocket', {
                    event: "player_joined",
                    data: formattedPlayer
                });
            });

            this.socket.on("player_left", (data) => {
                this.eventEmitter.emit("player_left", data);
                ext.sendMessage('relayAPISocket', {
                    event: "player_left",
                    data: data
                });
            });

            this.socket.on("room_kicked", (data) => {
                this.eventEmitter.emit("room_kicked", data);
                ext.sendMessage('relayAPISocket', {
                    event: "room_kicked",
                    data: data
                });
            });

            this.socket.on("room_closed", (data) => {
                this.eventEmitter.emit("room_closed", data);
                ext.sendMessage('relayAPISocket', {
                    event: "room_closed",
                    data: data
                });
            });

            this.socket.on("disconnect", (reason) => {
                this.eventEmitter.emit("disconnected", reason);
                ext.sendMessage('relayAPISocket', {
                    event: "disconnected",
                    data: reason
                });
            });

            this.socket.on("invite_received", (data) => {
                this.eventEmitter.emit("invite_received", data);
                ext.sendMessage('relayAPISocket', {
                    event: "invite_received",
                    data: data
                });
            });

            this.socket.on("relay_open", (targetID) => {
                this.eventEmitter.emit("relay_open", targetID);
            });

            this.socket.on("relay_close", (targetID = null) => {
                this.eventEmitter.emit("relay_close", targetID || undefined);
            });

            this.socket.on("relay_packet", (data) => {
                this.eventEmitter.emit("relay_packet", data);
            });

            this.socket.on("relay_ready", (isReady) => {
                this.eventEmitter.emit("relay_ready", isReady);
            });
        });
    };

    static async exit(callID, ext, roomCode) {
        if (this.user) await this.leaveRoom(roomCode).catch(e=>{});
        if (this.socket) this.socket.disconnect();
    };

    static getConnectionReady(isReady) {
        if (!this.socket || !this.socket.connected) return false;
        this.socket.emit("relay_get_ready", isReady);
        return true;
    };

    static setConnectionReady(isReady) {
        if (!this.socket || !this.socket.connected) return false;
        this.socket.emit("relay_ready", isReady);
        return true;
    };

    static openConnection() {
        if (!this.socket || !this.socket.connected) return false;
        this.socket.emit("relay_open");
        return true;
    };

    static closeConnection(targetID = null) {
        if (!this.socket || !this.socket.connected) return false;
        this.socket.emit("relay_close", targetID || undefined);
        return true;
    };
    
    static sendPacket(payload) {
        if (!this.socket || !this.socket.connected) return false;
        this.socket.emit("relay_packet", payload);
        return true;
    };

    static getHeaders() {
        const headers = { "Content-Type": "application/json" };
        if (this.token) headers["Authorization"] = `Bearer ${this.token}`;
        return headers;
    };

    static loadSession(callID = null, ext = null) {
        try {
            if (!fs.existsSync(this.sessionPath)) return false;

            const data = JSON.parse(fs.readFileSync(this.sessionPath, 'utf8'));
            if (data.token && data.user) {
                this.token = data.token;
                this.user = data.user;
                this.initSocket(ext);
                return true;
            };
        } catch (e) {};
        return false;
    };

    static saveSession(token, user) {
        try {
            fs.writeFileSync(this.sessionPath, JSON.stringify({ token, user }), 'utf8');
        } catch (e) {};
    };

    static clearSession() {
        try {
            if (fs.existsSync(this.sessionPath)) fs.unlinkSync(this.sessionPath);
        } catch (e) {};
    };

    static async ping(callID = null, ext = null) {
        try {
            const res = await fetch(`${apiBase}/ping`);
            if (!res.ok) return { online: false };
            return await res.json();
        } catch {
            return { online: false };
        };
    };

    // auth
    static async login(callID, ext, username, password) {
        try {
            const res = await fetch(`${apiBase}/auth/login`, {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (data.success) {
                this.token = data.token;
                this.user = data.user;
                this.saveSession(data.token, data.user);
                await this.initSocket(ext);
            };
            return data;
        } catch {
            return { success: false, error: "Server Error" };
        };
    };

    static async signup(callID, ext, username, password) {
        try {
            const res = await fetch(`${apiBase}/auth/signup`, {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify({ username, password })
            });
            return await res.json();
        } catch {
            return { success: false, error: "Server Error" };
        };
    };

    static async logout(callID = null, ext = null) {
        try {
            const res = await fetch(`${apiBase}/auth/logout`, {
                method: "POST",
                headers: this.getHeaders()
            });
            const data = await res.json();
            if (data.success) {
                if (this.socket) this.socket.disconnect();
                this.token = "";
                this.user = null;
                this.clearSession();
            };
            return data;
        } catch {
            if (this.socket) this.socket.disconnect();
            this.token = "";
            this.user = null;
            this.clearSession();
            return { success: true };
        };
    };

    // rooms
    static async joinRoom(callID, ext, code) {
        try {
            const res = await fetch(`${apiBase}/rooms/join`, {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify({ code })
            });
            const data = await res.json();
            if (data.success && data.players) {
                data.players = data.players.map(p => ({
                    ...p,
                    isMe: p.id === this.user?.id
                }));
            };
            return data;
        } catch {
            return { success: false, message: "Connection Error" };
        };
    };

    static async createRoom(callID, ext, settings) {
        try {
            const res = await fetch(`${apiBase}/rooms/create`, {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify({ settings })
            });
            const data = await res.json();
            if (data.success && data.players) {
                data.players = data.players.map(p => ({
                    ...p,
                    isMe: p.id === this.user?.id
                }));
            };
            return data;
        } catch {
            return { success: false };
        };
    };

    static async kickPlayer(callID, ext, code, targetID) {
        try {
            const res = await fetch(`${apiBase}/rooms/kick`, {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify({ code, targetID })
            });
            return await res.json();
        } catch {
            return { success: false };
        };
    };

    static async banPlayer(callID, ext, code, targetID) {
        try {
            const res = await fetch(`${apiBase}/rooms/ban`, {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify({ code, targetID })
            });
            return await res.json();
        } catch {
            return { success: false };
        };
    };

    static async leaveRoom(callID, ext, code) {
        try {
            const res = await fetch(`${apiBase}/rooms/leave`, {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify({ code })
            });
            return await res.json();
        } catch {
            return { success: false };
        };
    };

    // Friends
    static async friends(callID = null, ext = null) {
        try {
            const res = await fetch(`${apiBase}/friends/list`, {
                headers: this.getHeaders()
            });
            return await res.json();
        } catch {
            return { success: false };
        };
    };

    static async friendRequests(callID = null, ext = null) {
        try {
            const res = await fetch(`${apiBase}/friends/requests`, {
                headers: this.getHeaders()
            });
            return await res.json();
        } catch {
            return { success: false };
        };
    };

    static async addFriend(callID, ext, username) {
        try {
            const res = await fetch(`${apiBase}/friends/request`, {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify({ username })
            });
            return await res.json();
        } catch {
            return { success: false };
        };
    };

    static async acceptRequest(callID, ext, id) {
        try {
            const res = await fetch(`${apiBase}/friends/accept`, {
                method: "POST",
                headers: this.getHeaders(),
                body: JSON.stringify({ requestID: id })
            });
            return await res.json();
        } catch {
            return { success: false };
        };
    };

    static async declineRequest(callID, ext, friendID, requestID) {
        return this.removeFriend(callID, ext, friendID, requestID);
    };
    static async cancelRequest(callID, ext, friendID, requestID) {
        return this.removeFriend(callID, ext, friendID, requestID);
    };
    static async removeFriend(callID, ext, friendID, requestID) {
        try {
            const res = await fetch(`${apiBase}/friends/remove`, {
                method: "DELETE",
                headers: this.getHeaders(),
                body: JSON.stringify({ friendID, requestID })
            });
            return await res.json();
        } catch {
            return { success: false };
        };
    };

    static async updateStatus(callID, ext, status) {
        try {
            const res = await fetch(`${apiBase}/friends/presence`, {
                method: "PUT",
                headers: this.getHeaders(),
                body: JSON.stringify({ status })
            });
            return await res.json();
        } catch {
            return { success: false };
        };
    };

    // Invites
    static async invite(callID, ext, id) {
        try {
            const res = await fetch(`${apiBase}/invites/send/${id}`, {
                method: "POST",
                headers: this.getHeaders()
            });
            return await res.json();
        } catch {
            return { success: false };
        };
    };

    static async invites(callID = null, ext = null) {
        try {
            const res = await fetch(`${apiBase}/invites/list`, {
                headers: this.getHeaders()
            });
            return await res.json();
        } catch {
            return { success: false };
        };
    };

    static async acceptInvite(callID, ext, id) {
        try {
            const res = await fetch(`${apiBase}/invites/${id}/accept`, {
                method: "POST",
                headers: this.getHeaders()
            });
            return await res.json();
        } catch {
            return { success: false };
        };
    };
    
    static async declineInvite(callID, ext, id) {
        try {
            const res = await fetch(`${apiBase}/invites/${id}/decline`, {
                method: "POST",
                headers: this.getHeaders()
            });
            return await res.json();
        } catch {
            return { success: false };
        };
    };
};

module.exports = RelayAPI;