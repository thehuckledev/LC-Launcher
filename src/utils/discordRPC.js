import Neutralino from "@neutralinojs/lib";

export default class DiscordRPC {
    constructor({
        clientId = "",
        state = "",
        details = "",

        largeImageKey = "",
        largeImageText = "",
        smallImageKey = "",
        smallImageText = "",

        button1Label = "",
        button1Url = "",
        button2Label = "",
        button2Url = ""
    } = {}) {
        this.clientId = clientId;
        this.state = state;
        this.details = details;

        this.largeImageKey = largeImageKey;
        this.largeImageText = largeImageText;
        this.smallImageKey = smallImageKey;
        this.smallImageText = smallImageText;

        this.button1Label = button1Label;
        this.button1Url = button1Url;
        this.button2Label = button2Label;
        this.button2Url = button2Url;

        this.procId = null;
        this.enabled = false;

        this._bindExitHandlers();
    };

    getLibPath() {
        const base = NL_PATH + "/libs";

        switch (NL_OS) {
            case "Linux":
                return `${base}/simple-discord-rpc-linux`;
            case "Darwin":
                return `${base}/simple-discord-rpc-osx`;
            case "Windows":
                return `${base}/simple-discord-rpc.exe`;
        };
    };

    async killAllInstances() {
        try {
            if (NL_OS === "Windows")
                await Neutralino.os.execCommand(`taskkill /IM simple-discord-rpc.exe /F`);
            else if (NL_OS === "Linux")
                await Neutralino.os.execCommand(`pkill -f simple-discord-rpc-linux`);
            else
                await Neutralino.os.execCommand(`pkill -f simple-discord-rpc-osx`);
        } catch {};
    };

    async enable() {
        if (this.enabled) return;

        const bin = this.getLibPath();
        const cmd = `"${bin}" ${this.clientId}`;

        if (NL_OS !== "Windows") {
            try {
                await Neutralino.os.execCommand(`chmod +x "${bin}"`);
            } catch {};
        };

        await this.killAllInstances();
        const proc = await Neutralino.os.spawnProcess(cmd);
        this.procId = proc.id;
        this.enabled = true;

        await this.updateProcess();
    };

    async disable() {
        if (!this.procId) return;

        try {
            await Neutralino.os.updateSpawnedProcess(this.procId, "exit");
        } catch {};

        this.procId = null;
        this.enabled = false;
    };

    async edit(data = {}) {
        Object.assign(this, data);
        if (!this.enabled) return;

        await this.updateProcess();
    };

    async updateProcess() {
        const payload = JSON.stringify({
            state: this.state,
            details: this.details,

            large_image_key: this.largeImageKey,
            large_image_text: this.largeImageText,
            small_image_key: this.smallImageKey,
            small_image_text: this.smallImageText,

            button1_label: this.button1Label,
            button1_url: this.button1Url,
            button2_label: this.button2Label,
            button2_url: this.button2Url
        });

        await Neutralino.os.updateSpawnedProcess(this.procId, 'stdIn', payload + "\n");
    }

    _bindExitHandlers() {
        window.beforeExitRPC = async () => {
            await this.disable();
            await this.killAllInstances();
        };

        Neutralino.events.on("windowClose", async () => {
            await this.disable();
            await this.killAllInstances();
            Neutralino.app.exit();
        });

        Neutralino.events.on("serverOffline", async () => {
            await this.disable();
            await this.killAllInstances();
        });

        Neutralino.events.on("appClientDisconnect", async () => {
            await this.disable();
            await this.killAllInstances();
        });
    };
};