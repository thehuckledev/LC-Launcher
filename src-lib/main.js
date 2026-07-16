console.log("lcLib ran");

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
    ext.on('close', async () => {
        try {
            await publicClasses.discordRPC.disable(null, ext);
        } catch {};

        process.exit(0);
    });
    ext.run(processAppEvent);

    console.log("lcLib async global loop ran");
})();