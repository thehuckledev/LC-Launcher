import Neutralino from "@neutralinojs/lib";

export default class Download {
    constructor(url, {
        id = crypto.randomUUID(),
        label = "Downloading..."
    } = {}) {
        this.id = id;
        this.url = url;

        this.label = label;

        this.progress = 0;
        this.status = "idle";
        this.error = null;
        this.procId = null;

        this.eta = 0;
        this.speed = 0;
        this.lastPercent = -1;

        this.controller = new AbortController();
        this.blob = null;
    };

    async start(savePath) {
        this.status = "starting";
        this.emit();

        return new Promise(async (resolve, reject) => {
            try {
                this.status = "downloading";
                this.emit();

                const cmd = `curl -L --progress-bar "${this.url}" -o "${savePath}"`;

                const proc = await Neutralino.os.spawnProcess(cmd);
                this.procId = proc.id;

                let lastTime = Date.now();
                let lastPercent = 0;

                const onData = async (evt) => {
                    if (evt.detail.id !== proc.id) return;

                    switch(evt.detail.action) {
                        case 'stdOut':
                        case 'stdErr':
                            console.log(evt.detail.data)
                            const output = evt.detail.data;
                            const match = output.match(/[\d.]+/g);
                            if (match && output.includes("%")) {
                                const raw = match[match.length - 1];
                                const percent = parseFloat(raw);
                                if (!isNaN(percent) && percent <= 100 && percent > this.lastPercent) {
                                    this.lastPercent = percent;
                                    this.progress = Math.floor(percent);

                                    const now = Date.now();
                                    const timeDiff = (now - lastTime) / 1000;

                                    if (timeDiff >= 0.5) {
                                        const percentDiff = percent - lastPercent;
                                        this.speed = percentDiff / timeDiff;

                                        if (this.speed > 0) {
                                            const remaining = 100 - percent;
                                            this.eta = remaining / this.speed;
                                        };

                                        lastTime = now;
                                        lastPercent = percent;
                                    };

                                    this.emit();
                                };
                            };
                            break;
                        case 'exit':
                            await onExit(evt);
                            break;
                    };
                };

                const onExit = async (evt) => {
                    await Neutralino.events.off("spawnedProcess", onData);

                    this.progress = 100;
                    this.status = "finished";
                    resolve();

                    this.speed = 0;
                    this.eta = 0;
                    this.lastPercent = -1;
                    this.emit();
                };

                Neutralino.events.on("spawnedProcess", onData);
            } catch (err) {
                this.status = "error";
                this.error = err.message;
                this.speed = 0;
                this.eta = 0;
                this.lastPercent = -1;

                this.emit();
                await this.cancel();
                reject(err);
            };
        });
    };

    async cancel() {
        if (!this.procId) return;
        
        await Neutralino.os.updateSpawnedProcess(this.procId, 'exit');
        this.status = "cancelled";
        this.speed = 0;
        this.eta = 0;
        this.emit();
    };

    formatETA() {
        if (!this.eta || !isFinite(this.eta)) return "";

        const sec = Math.floor(this.eta);

        if (sec < 60) return `${sec}s`;
        if (sec < 3600) {
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            return `${m}m ${s}s`;
        };

        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        return `${h}h ${m}m`;
    };

    emit() {
        window.dispatchEvent(
            new CustomEvent("installProgress", {
                detail: {
                    id: this.id,
                    active: this.status === "downloading" || this.status === "starting",
                    status: this.status,
                    percent: this.progress,
                    label: this.label,
                    eta: this.formatETA()
                }
            })
        );
    };
};