const { AutoClient } = require('discord-auto-rpc');


const defaultActivity = {
    instance: false
};

let clientId = null;
let client = null;
let currentConfig = defaultActivity;

class DiscordRPC {
    static async init(callID, ext, clientIdTemp) {
        clientId = clientIdTemp;
        return true;
    };

    static async enable(callID, ext) {
        if (client || !clientId) return false;

        return new Promise((resolve, reject) => {
            try {
                client = new AutoClient({ transport: 'ipc' });

                client.on('ready', () => {
                    if (!currentConfig) return resolve(true);
                    client.setActivity(currentConfig).catch(err => console.error("Failed to set Discord activity:", err));
                    resolve(true);
                });
                client.on('error', (err) => {
                    console.error("Discord RPC:", err);
                    resolve(false); 
                });

                client.endlessLogin({ clientId });
            } catch (e) {
                console.error("Discord RPC:", e);
                resolve(false);
            };
        });
    };

    static async edit(callID, ext, config) {
        currentConfig = config;

        if (!client || !client.socket || !clientId) return false;

        client.setActivity({ ...defaultActivity, ...config }).catch((err) => {
            console.error("Failed to set Discord activity:", err);
        });
        
        return true;
    };

    static async disable(callID, ext) {
        if (!client || !clientId) return false;

        await client.destroy().catch(e=>{});
        client = null;

        return true;
    };
};

module.exports = DiscordRPC;