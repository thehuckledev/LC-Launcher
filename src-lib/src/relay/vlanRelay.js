const net = require("net");

const RelayAPI = require("./relayAPI");
const { relayPort, hostRelayPort } = require("./relayConfig");

class VLANRelay {
    static maxPacketSize = 2 * 1024 * 1024; // 2mb
    static relayHandler = null;
    static connections = new Map();
    static localServer = null;
    static isHost = false;
    static isHostReady = false;

    static async start(callID, ext, { isHost }) {
        this.isHost = isHost;

        this.relayHandler = this.handlePacket.bind(this);
        RelayAPI.on("relay_packet", this.relayHandler);

        this.closeHandler = this.handleClose.bind(this); // stops ghosts players being left over
        RelayAPI.on("relay_close", this.closeHandler);

        if (!!this.isHost) {
            this.watchHostPort();
            this.openHandler = this.handleOpen.bind(this); // hosts only want connection when another player is actually trying to join
            RelayAPI.on("relay_open", this.openHandler);
        } else {
            this.readyHandler = this.handleReady.bind(this);
            RelayAPI.on("relay_ready", (isReady) => this.readyHandler(ext, isReady));

            await this.startClient(); // clients created on room join

            RelayAPI.getConnectionReady(); // if host already joined world, this solves that issue for the relay hint
        };
    };

    static startClient() {
        return new Promise((resolve, reject) => {
            this.localServer = net.createServer((localSocket) => {
                localSocket.setNoDelay(true);
                
                let exists = this.connections.get("main");
                if (exists) return; // dont want multiple game clients from one player
                
                this.connections.set("main", localSocket);

                // server starts off the handshake which is triggered by connection opening
                RelayAPI.openConnection();

                let closed = false;
                const sendClose = () => {
                    if (closed) return;
                    closed = true;

                    RelayAPI.closeConnection();
                    this.connections.delete("main");
                };

                localSocket.on("data", (data) => {
                    if (
                        !Buffer.isBuffer(data) ||
                        data.length > this.maxPacketSize
                    ) return;
                    
                    RelayAPI.sendPacket(data);
                });
                localSocket.on("end", sendClose);
                localSocket.on("close", sendClose);
                localSocket.on("error", () => {
                    sendClose();
                    localSocket.destroy();
                });
            });

            const onError = (err) => reject(err);
            this.localServer.once("error", onError);
            this.localServer.listen(relayPort, "127.0.0.1", () => {
                this.localServer.off("error", onError);
                resolve();
            });
        });
    };

    static startHost(targetID) {
        const lce = net.connect(hostRelayPort, "127.0.0.1");
        lce.setNoDelay(true);
        this.connections.set(targetID, lce);

        let closed = false;
        const sendClose = () => {
            if (closed) return;
            closed = true;

            RelayAPI.closeConnection(targetID);

            lce.removeAllListeners();
            this.connections.delete(targetID);
        };

        lce.on("data", (data) => {
            if (
                !Buffer.isBuffer(data) ||
                data.length > this.maxPacketSize
            ) return;

            RelayAPI.sendPacket({ targetID, data });
        });
        lce.on("end", sendClose);
        lce.on("close", sendClose);
        lce.on("error", () => {
            sendClose();
            lce.destroy();
        });
    
        return lce;
    };

    static watchHostPort() {
        if (this.portCheckInterval) clearInterval(this.portCheckInterval);
        
        this.portCheckInterval = setInterval(() => {
            const client = new net.Socket();
            
            client.setTimeout(500);
            client.on('connect', () => {
                client.destroy();
                if (!this.isHostReady) {
                    this.isHostReady = true;
                    ext.sendMessage('hostReady', true);
                    
                    RelayAPI.setConnectionReady(true);
                };
            });
            client.on('timeout', () => client.destroy());
            client.on('error', () => {
                if (this.isHostReady) {
                    this.isHostReady = false;
                    ext.sendMessage('hostReady', false);

                    RelayAPI.setConnectionReady(false);
                };
                client.destroy();
            });
            client.connect(hostRelayPort, "127.0.0.1");
        }, 4000);
    };

    static handleReady(ext, isReady) {
        if (this.isHost) return;

        this.isHostReady = isReady;
        ext.sendMessage('hostReady', isReady);
    };

    static handleOpen(targetID) {
        if (!this.isHost) return;
    
        this.disconnect(targetID);
        this.startHost(targetID);
    };

    static handleClose(targetID = null) {
        if (!!this.isHost) {
            this.disconnect(targetID, false);
        } else {
            this.disconnect(null, false);
        };
    };

    static handlePacket(packet) {
        if (!!this.isHost) {
            if (
                !packet ||
                typeof packet !== "object" ||
                typeof packet.targetID !== "string" ||
                packet.targetID.length > 64 ||
                !Buffer.isBuffer(packet.data) ||
                packet.data.length > this.maxPacketSize
            ) return;
            
            let socket = this.connections.get(packet.targetID);
            if (!socket) return; // they should be sending open first

            if (socket.destroyed) return this.connections.delete(packet.targetID);

            socket.write(packet.data);
        } else {
            if (
                !Buffer.isBuffer(packet) ||
                packet.length > this.maxPacketSize
            ) return;

            const socket = this.connections.get("main");
            if (!socket) return;

            if (socket.destroyed) return this.connections.delete("main");

            socket.write(packet);
        };
    };

    static disconnect(targetID = null, notify = true) {
        if (!!this.isHost) {
            let socket = this.connections.get(targetID);
            if (!socket) return;

            if (notify) RelayAPI.closeConnection(targetID);

            socket.removeAllListeners();
            socket.end?.();
            socket.destroy();

            this.connections.delete(targetID);
        } else {
            let socket = this.connections.get("main");
            if (!socket) return;

            if (notify) RelayAPI.closeConnection();

            socket.removeAllListeners();
            socket.end?.();
            socket.destroy();

            this.connections.delete("main");
        };
    };

    static stop(callID, ext) {
        for (const socket of this.connections.values()) {
            socket.removeAllListeners();
            socket.end?.();
            socket.destroy();
        };
        this.connections.clear();

        if (this.portCheckInterval) {
            clearInterval(this.portCheckInterval);
            this.portCheckInterval = null;
        };
        this.isHostReady = false;

        if (this.relayHandler) RelayAPI.off("relay_packet", this.relayHandler);
        if (this.openHandler) RelayAPI.off("relay_open", this.openHandler);
        if (this.closeHandler) RelayAPI.off("relay_close", this.closeHandler);
        if (this.readyHandler) RelayAPI.off("relay_ready", this.readyHandler);

        this.relayHandler = null;
        this.openHandler = null;
        this.closeHandler = null;

        if (this.localServer) {
            this.localServer.close();
            this.localServer = null;
        };
    };
};

module.exports = VLANRelay;