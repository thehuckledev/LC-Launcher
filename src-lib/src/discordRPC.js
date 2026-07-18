const { Client } = require('discord-rpc-revamp');

const started = Date.now();
const defaultActivity = {
    details: "Loading..",
    state: "Loading..",
    largeImageKey: "logo",
    largeImageText: "Loading..",
    startTimestamp: started,
    instance: false
};

let clientId = null;
let client = null;
let currentConfig = { ...defaultActivity };
let isReady = false;

class DiscordRPC {
    static async enable(callID, ext, clientIdTemp) {
        clientId = clientIdTemp;
        if (client) return false;

        return new Promise((resolve, reject) => {
            try {
                client = new Client({ transport: 'ipc' });

                client.on('ready', () => {
                    isReady = true;
                    if (currentConfig)
                        client.setActivity(currentConfig).catch(err => console.error("Failed to set Discord activity:", err));
                    resolve(true);
                });
                client.on('error', (err) => {
                    console.error("Discord RPC:", err);
                    isReady = false;
                    resolve(false); 
                });

                client.connect({ clientId }).catch((err) => {
                    console.error("Discord RPC connect failed:", err);
                    isReady = false;
                    resolve(false);
                });

                setTimeout(() => {
                    if (isReady) return;

                    console.warn("Discord RPC connect timeout");
                    resolve(false);
                }, 3000);
            } catch (e) {
                console.error("Discord RPC:", e);
                isReady = false;
                resolve(false);
            };
        });
    };

    static async edit(callID, ext, config) {
        currentConfig = { ...defaultActivity, ...config };

        if (!client || !isReady || !clientId) return true;

        client.setActivity(currentConfig).catch((err) => {
            console.error("Failed to set Discord activity:", err);
        });
        
        return true;
    };

    static async disable(callID, ext) {
        if (!client) return false;

        try {
            isReady = false;
            await client.destroy();
            console.log("Discord RPC disabled");
        } catch (e) {} finally {
            client = null;
        };

        return true;
    };
};

process.on('exit', async () => {
    await DiscordRPC.disable(null, null);
});

module.exports = DiscordRPC;