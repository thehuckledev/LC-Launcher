import Neutralino from "@neutralinojs/lib";
import Filesystem from "../lib/filesystem";

export default class Unzip {
    constructor(zipPath, destPath, {
        id = crypto.randomUUID(),
        label = "Extracting..."
    } = {}) {
        this.id = id;

        this.zipPath = zipPath;
        this.destPath = destPath;

        this.label = label;

        this.progress = 0;
        this.status = "idle";
        this.error = null;
    };

    async start() {
        this.status = "extracting";
        this.progress = 0;
        this.emit();

        return new Promise(async (resolve, reject) => {
            const onProgressEvent = (event) => {
                const packet = event.detail;
                
                if (packet.callID !== this.id) return;

                this.progress = packet.percent;
                this.emit();
            };

            Neutralino.events.on('unzipProgress', onProgressEvent);

            try {
                const response = await Filesystem.unzip(this.zipPath, this.destPath, this.id);

                Neutralino.events.off('unzipProgress', onProgressEvent);

                this.progress = 100;
                this.status = "finished";
                this.emit();
                
                resolve(response);

            } catch (err) {
                Neutralino.events.off('unzipProgress', onProgressEvent);
                
                this.status = "error";
                this.error = err.message;
                this.emit();
                reject(err);
            };
        });
    };

    async cancel() {
        this.status = "cancelled";
        this.emit();
    };

    emit() {
        window.dispatchEvent(
            new CustomEvent("installProgress", {
                detail: {
                    id: this.id,
                    active: this.status === "extracting" || this.status === "starting",
                    status: this.status,
                    percent: this.progress,
                    label: this.label
                }
            })
        );
    };
};