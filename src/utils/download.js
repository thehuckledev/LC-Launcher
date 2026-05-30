import Neutralino from "@neutralinojs/lib";
import Net from "../lib/net";

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

        this.eta = 0;
        this.speed = 0;

        this.lastTime = Date.now();
        this.lastDownloadedBytes = 0;
    };

    async start(savePath) {
        this.status = "starting";
        this.emit();

        return new Promise(async (resolve, reject) => {
            this.status = "downloading";
            this.emit();

            const onProgressEvent = (event) => {
                const packet = event.detail;
                
                if (packet.callID !== this.id) return;

                const now = Date.now();
                const timeDiff = (now - this.lastTime) / 1000;

                this.progress = packet.percent;

                if (timeDiff >= 0.5) {
                    const bytesDiff = packet.downloadedBytes - this.lastDownloadedBytes;
                    const byteSpeed = bytesDiff / timeDiff;
                    
                    if (byteSpeed > 0) {
                        const remaining = packet.totalBytes - packet.downloadedBytes;
                        this.eta = remaining / byteSpeed;
                    };

                    this.lastTime = now;
                    this.lastDownloadedBytes = packet.downloadedBytes;
                };

                this.emit();
            };

            Neutralino.events.on("downloadProgress", onProgressEvent);

            try {
                const response = await Net.download(this.url, savePath, {}, this.id);

                Neutralino.events.off("downloadProgress", onProgressEvent);

                this.progress = 100;
                this.status = "finished";
                this.speed = 0;
                this.eta = 0;
                this.emit();
                resolve(response);
            } catch (err) {
                Neutralino.events.off('downloadProgress', onProgressEvent);
                
                this.status = "error";
                this.error = err.message;
                this.speed = 0;
                this.eta = 0;

                this.emit();
                reject(err);
            };
        });
    };

    async cancel() {
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