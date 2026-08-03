import { io } from "socket.io-client";

export class API {
    constructor(baseUrl) {
        this.url = baseUrl.replace(/\/$/, "");
        this.token = null;
        this.socket = null;
        this.activeChatListeners = new Map();
    };

    async #request(path, method = "GET", body = null) {
        const options = {
            method,
            headers: {
                "Content-Type": "application/json"
            }
        };

        if (this.token) options.headers.Authorization = `Bearer ${this.token}`;
        if (body) options.body = JSON.stringify(body);

        const res = await fetch(this.url + path, options);
        const data = await res.json();

        if (!res.ok || data.success === false) throw new Error(data.error || "Request failed");

        return data;
    };

    // Auth
    async login(username, password) {
        const res = await this.#request("/auth/login", "POST", { username, password });
        if (res.success) this.token = res.token;
        return res;
    };
    async signup(username, password) {
        return this.#request("/auth/signup", "POST", { username, password });
    };
    async logout() {
        const res = await this.#request("/auth/logout", "POST");
        if (this.socket) this.socket.disconnect();
        this.token = null;
        return res;
    };

    // Friends
    async friends() {
        return this.#request("/friends/list");
    };
    async friendRequests() {
        return this.#request("/friends/requests");
    };
    async addFriend(username) {
        return this.#request("/friends/request", "POST", { username });
    };
    async acceptRequest(id) {
        return this.#request("/friends/accept", "POST", { requestID: id });
    };
    async declineRequest(friendID, requestID) {
        return this.removeFriend(friendID, requestID);
    };
    async cancelRequest(friendID, requestID) {
        return this.removeFriend(friendID, requestID);
    };
    async removeFriend(friendID, requestID) {
        return this.#request("/friends/remove", "DELETE", { friendID, requestID });
    };
    async updateStatus(status) {
        return this.#request("/friends/presence", "PUT", { status });
    };

    // Host
    async startHost(ip, port, world) {
        return this.#request("/host/start", "POST", { hostIP: ip, hostPort: port, worldName: world });
    };
    async stopHost() {
        return this.#request("/host/stop", "POST");
    };
    async getJoinToken() {
        return this.#request("/host/token");
    };
    async validateJoinToken(token) {
        return this.#request("/host/validate", "POST", { token });
    };

    // Invites
    async invite(id) {
        return this.#request(`/sessions/invite/${id}`, "POST");
    };
    async invites() {
        return this.#request("/sessions/invites");
    };
    async acceptInvite(id) {
        return this.#request(`/sessions/invites/${id}/accept`, "POST");
    };
    async declineInvite(id) {
        return this.#request(`/sessions/invites/${id}/decline`, "POST");
    };

    // Chat
    CreateChat(targetID, onMessage) {
        if (onMessage) this.activeChatListeners.set(targetID, onMessage);

        return {
            sendMessage: (content) => this.sendMessage(targetID, content),
            editMessage: (messageID, content) => this.editMessage(messageID, content),
            deleteMessage: (messageID) => this.deleteMessage(messageID),
            getHistory: () => this.getHistory(targetID),
            destroy: () => this.activeChatListeners.delete(targetID)
        };
    };
    async sendMessage(to, content) {
        return this.request("/chat/send", "POST", { to, content });
    };
    async getHistory(friendID) {
        return this.request(`/chat/history/${friendID}`, "GET");
    };
    async editMessage(messageID, content) {
        return this.request("/chat/edit", "PATCH", { messageID, content });
    };
    async deleteMessage(messageID) {
        return this.request("/chat/delete", "DELETE", { messageID });
    };

    // Socket
    connect({ onInvite, onRelayClosed }) {
        if (!this.token) throw new Error("Must login first");
        this.socket = io(this.url, { auth: { token: this.token } });
        if (onInvite) this.socket.on("invite_received", onInvite);
        if (onRelayClosed) this.socket.on("relay_closed", onRelayClosed);
        this.socket.on("receive_message", (data) => {
            if (this.activeChatListeners.has(data.fromID)) {
                const callback = this.activeChatListeners.get(data.fromID);
                callback(data);
            };
        });
        return this.socket;
    };
};