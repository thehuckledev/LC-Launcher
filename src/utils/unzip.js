import Neutralino from "@neutralinojs/lib";

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

        this.procId = null;

        this.totalFiles = 0;
        this.extracted = 0;
        this.lastPercent = -1;
    };

    async start() {
        this.status = "starting";
        this.emit();

        try {
            this.status = "counting";
            this.emit();

            const listProc = await Neutralino.os.execCommand(`unzip -l "${this.zipPath}" | tail -n 1 | awk '{print $2}'`);
            this.totalFiles = parseInt(listProc.stdOut.trim());

            this.status = "extracting";
            this.emit();

            const proc = await Neutralino.os.spawnProcess(`unzip -o "${this.zipPath}" -d "${this.destPath}"`);
            this.procId = proc.id;

            await new Promise((resolve) => {
                const handler = (evt) => {
                    if (evt.detail.id !== proc.id) return;
                    if (evt.detail.action === "stdOut") {
                        const lines = evt.detail.data.split("\n");
                        for (const line of lines) {
                            if (
                                line.includes("inflating:") ||
                                line.includes("extracting:") ||
                                line.includes("creating:")
                            ) {
                                this.extracted++;

                                const percent =
                                    (this.extracted / this.totalFiles) * 100;

                                if (percent > this.lastPercent) {
                                    this.lastPercent = percent;
                                    this.progress = Math.floor(percent);
                                    this.emit();
                                };
                            };
                        };
                    };

                    if (evt.detail.action === "exit") {
                        Neutralino.events.off("spawnedProcess", handler);

                        this.progress = 100;
                        this.status = "finished";
                        this.emit();

                        resolve();
                    };
                };

                Neutralino.events.on("spawnedProcess", handler);
            });
        } catch (err) {
            this.status = "error";
            this.error = err.message;
            this.emit();
            throw err;
        };
    };

    async cancel() {
        if (!this.procId) return;
        
        await Neutralino.os.updateSpawnedProcess(this.procId, "exit");
        this.status = "cancelled";
        this.emit();
    };

    emit() {
        window.dispatchEvent(
            new CustomEvent("installProgress", {
                detail: {
                    id: this.id,
                    active:
                        this.status === "extracting" ||
                        this.status === "starting" ||
                        this.status === "counting",
                    status: this.status,
                    percent: this.progress,
                    label: this.label
                }
            })
        );
    };
};