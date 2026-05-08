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
            if (NL_OS === "Windows") {
                this.status = "extracting";
                this.progress = 0;
                this.emit();

                const psCommand = `powershell -NoProfile -Command "
                    Add-Type -AssemblyName 'System.IO.Compression.FileSystem';
                    [System.IO.Compression.ZipFile]::ExtractToDirectory('${this.zipPath}', '${this.destPath}');
                "`;

                const proc = await Neutralino.os.spawnProcess(psCommand);
                // this has issues below with .exe and .dlls being blocked
                //const proc = await Neutralino.os.spawnProcess(`powershell -NoProfile -Command "Expand-Archive -LiteralPath '${this.zipPath}' -DestinationPath '${this.destPath}' -Force"`);
                this.procId = proc.id;

                let fakingProgress = true;
                let timeoutFunc = null;
                const fakeProgress = () => {
                    if (!fakingProgress || this.progress >= 90) return;
                    const delay = 1000 + Math.random() * 1000;
                    const increment = Math.floor(Math.random() * 8) + 2;

                    timeoutFunc = setTimeout(() => {
                        if(!fakingProgress) return;
                        this.progress = Math.min(this.progress + increment, 90);
                        this.emit();
                        fakeProgress();
                    }, delay);
                };
                fakeProgress();

                await new Promise((resolve) => {
                    const handler = (evt) => {
                        if (evt.detail.id !== proc.id) return;
                        if (evt.detail.action !== "exit") return;

                        Neutralino.events.off("spawnedProcess", handler);

                        clearTimeout(timeoutFunc);
                        fakingProgress = false;

                        this.progress = 100;
                        this.status = "finished";
                        this.emit();

                        resolve();
                    };

                    Neutralino.events.on("spawnedProcess", handler);
                });
            } else {
                this.status = "counting";
                this.emit();

                let isTar = this.zipPath.includes(".tar")
                let listCmd = isTar 
                    ? `tar -tf "${this.zipPath}" | wc -l` 
                    : `unzip -l "${this.zipPath}" | tail -n 1 | awk '{print $2}'`;

                const listProc = await Neutralino.os.execCommand(listCmd);
                this.totalFiles = parseInt(listProc.stdOut.trim());

                this.status = "extracting";
                this.emit();

                const extractCmd = isTar
                    ? `tar -xvf "${this.zipPath}" -C "${this.destPath}"`
                    : `unzip -o "${this.zipPath}" -d "${this.destPath}"`;

                const proc = await Neutralino.os.spawnProcess(extractCmd);
                this.procId = proc.id;

                await new Promise((resolve) => {
                    const handler = (evt) => {
                        if (evt.detail.id !== proc.id) return;
                        if (evt.detail.action === "stdOut" || evt.detail.action === "stdErr") {
                            const lines = evt.detail.data.split("\n");
                            for (const line of lines) {
                                const cleanLine = line.trim();
                                if (!cleanLine) continue;

                                let processed = false;
                                if (isTar) {
                                    processed = true; 
                                } else {
                                    processed = cleanLine.includes("inflating:") || 
                                                cleanLine.includes("extracting:") || 
                                                cleanLine.includes("creating:");
                                };

                                if (processed) {
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
            };
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