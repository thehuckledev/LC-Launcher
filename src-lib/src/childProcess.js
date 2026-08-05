const activeProcesses = new Map();

function terminate(proc) {
    if (process.platform === "win32") {
        try {
            return Bun.spawnSync(["taskkill", "/PID", String(proc.pid), "/T", "/F"]);
        } catch (err) {
            console.error("Failed to terminate process", err);
        };
    };

    try {
        proc.kill(15);
    } catch (err) {
        console.error("Failed to signal process:", err);
    };
};

function forceKill(proc) {
    if (process.platform === "win32") {
        try {
            Bun.spawnSync(["taskkill", "/PID", String(proc.pid), "/T", "/F"]);
        } catch (err) {
            console.error("Failed to force kill process", err);
        };
        return;
    };

    try {
        proc.kill(9);
    } catch (err) {
        console.error("Failed to force kill process:", err);
    };
};

class ChildProcess {
    static async spawn(callID, ext, config) {
        const { cmd, args = [], cwd, env = {} } = config;

        try {
            const processEnv = { ...process.env, ...env };

            const proc = Bun.spawn([cmd, ...args], {
                cwd: cwd || undefined,
                env: processEnv,
                stdout: "pipe",
                stderr: "pipe"
            });

            activeProcesses.set(callID, proc);

            (async () => {
                const reader = proc.stdout.getReader();
                const decoder = new TextDecoder();
                let buffer = "";
                let timer = null;

                const flush = () => {
                    if (buffer.length > 0) {
                        ext.sendMessage('procData', { callID, type: 'stdOut', data: buffer });
                        buffer = "";
                    };
                    
                    if (timer) {
                        clearInterval(timer);
                        timer = null;
                    };
                };

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });

                        if (!timer) timer = setInterval(flush, 200);
                    };
                } catch (err) {
                    console.error("stdOut stream error:", err);
                } finally {
                    flush();
                };
            })();

            (async () => {
                const reader = proc.stderr.getReader();
                const decoder = new TextDecoder();
                let buffer = "";
                let timer = null;

                const flush = () => {
                    if (buffer.length > 0) {
                        ext.sendMessage('procData', { callID, type: 'stdErr', data: buffer });
                        buffer = "";
                    };

                    if (timer) {
                        clearInterval(timer);
                        timer = null;
                    };
                };

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });

                        if (!timer) timer = setInterval(flush, 200);
                    };
                } catch (err) {
                    console.error("stdErr stream error:", err);
                } finally {
                    flush();
                };
            })();

            (async () => {
                const exitCode = await proc.exited;
                activeProcesses.delete(callID);

                ext.sendMessage('procData', {
                    callID,
                    type: 'exit',
                    data: exitCode
                });
            })();

            return { success: true, id: callID, pid: proc.pid };
        } catch (error) {
            if (activeProcesses.has(callID)) activeProcesses.delete(callID);
            throw new Error(`Failed to spawn process: ${error.message}`);
        };
    };

    static async kill(callID, ext, targetCallID) {
        const proc = activeProcesses.get(targetCallID);

        if (!proc) return { success: false, error: "Process not found" };

        try {
            terminate(proc);

            setTimeout(() => {
                if (activeProcesses.has(targetCallID)) forceKill(proc);
            }, 500);

            return { success: true };
        } catch (error) {
            throw new Error(`Failed to kill process: ${error.message}`);
        };
    };

    static killAll() {
        for (const [callID, proc] of activeProcesses.entries()) {
            try {
                terminate(proc);
                forceKill(proc);
            } catch (err) {
                console.error(`Failed to kill process:`, callID, err);
            };
        };

        activeProcesses.clear();
    };
};

process.on('exit', () => {
    ChildProcess.killAll();
});

module.exports = ChildProcess;