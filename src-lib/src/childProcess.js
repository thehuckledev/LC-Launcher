const activeProcesses = new Map();

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
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        
                        ext.sendMessage('procData', {
                            callID,
                            type: 'stdOut',
                            data: decoder.decode(value)
                        });
                    };
                } catch (err) {
                    console.error("stdOut stream error:", err);
                };
            })();

            (async () => {
                const reader = proc.stderr.getReader();
                const decoder = new TextDecoder();
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        ext.sendMessage('procData', {
                            callID,
                            type: 'stdErr',
                            data: decoder.decode(value)
                        });
                    };
                } catch (err) {
                    console.error("stdErr stream error:", err);
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
            proc.kill(15);
            
            setTimeout(() => {
                if (activeProcesses.has(targetCallID)) proc.kill(9);
            }, 500);

            return { success: true };
        } catch (error) {
            throw new Error(`Failed to kill process: ${error.message}`);
        };
    };
};

process.on('exit', () => {
    for (const [callID, proc] of activeProcesses.entries()) {
        try {
            proc.kill(9);
        } catch (err) {
            console.error(`Failed to kill process:`, callID, err);
        };
    };
    
    activeProcesses.clear();
});

module.exports = ChildProcess;