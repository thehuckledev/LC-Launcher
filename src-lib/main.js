console.log("lcLib ran");

const { execFile } = require("child_process");
const NeutralinoExtension = require('./neutralino-extension');
const DEBUG = true;

console.log("lcLib imports complete");

const publicClasses = {
    net: require("./src/net"),
    filesystem: require("./src/filesystem"),
    discordRPC: require("./src/discordRPC"),
    childProcess: require("./src/childProcess"),
};

console.log("lcLib publicClasses defined");

let ext;
let isExiting = false;

async function exit(exitCode = 0) {
    if (isExiting) return;
    isExiting = true;
 
    console.log("lcLib exit start");
 
    const watchdog = setTimeout(() => {
        console.error("lcLib shutdown timeout fired");
        process.exit(exitCode);
    }, 1500);
    watchdog.unref?.();
 
    try {
        publicClasses.childProcess.killAll();
    } catch (err) {
        console.error("lcLib error killing child processes during exit:", err);
    };
 
    try {
        await publicClasses.discordRPC.disable(null, null);
    } catch (err) {
        console.error("lcLib error disabling Discord RPC during exit:", err);
    };
 
    clearTimeout(watchdog);
    console.log("lcLib exit done");
    process.exit(exitCode);
};

function startParentWatchdog(intervalMs = 5000) {
    if (process.platform !== "win32") return;

    const processName = "LC Launcher.exe";

    function check() {
        if (isExiting) return;

        execFile("tasklist.exe", ["/FI", `IMAGENAME eq ${processName}`], (err, stdout) => {
            if (isExiting) return;

            if (!err && stdout && !stdout.toLowerCase().includes(processName.toLowerCase())) {
                console.log(`${processName} closed, exiting lcLib...`);
                return exit(0);
            };

            setTimeout(check, intervalMs);
        });
    };

    console.log("lcLib startParentWatchdog ran");
    check();
};

async function processAppEvent(d) {
    if(ext.isEvent(d, 'runBun')) {
        const { callID, class: className, function: funcName, args = [] } = d.data;

        try {
            const targetClass = publicClasses[className]; 
            if (targetClass && typeof targetClass[funcName] === 'function') {
                const result = await targetClass[funcName](callID, ext, ...args);
                ext.sendMessage('bunResponse', {
                    callID,
                    success: true,
                    result: result
                });
            } else {
                const errMsg = `Function ${className}.${funcName}() not found`;
                console.error(errMsg);
                ext.sendMessage('bunResponse', {
                    callID,
                    success: false,
                    error: errMsg
                });
            };
        } catch (err) {
            console.error(err);
            ext.sendMessage('bunResponse', { 
                callID,
                success: false,
                error: err.message
            });
        };
    };
};

console.log("lcLib processAppEvent defined");

(async() => {
    console.log("lcLib async global loop");

    ext = await new NeutralinoExtension(DEBUG);
    ext.run(processAppEvent, 5000, exit);

    startParentWatchdog();

    console.log("lcLib async global loop ran");
})();