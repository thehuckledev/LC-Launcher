import Neutralino from "@neutralinojs/lib";

Neutralino.events.on('procData', (event) => {
    const { callID, type, data } = event.detail;
    
    window.dispatchEvent(new CustomEvent(`proc:${callID}`, {
        detail: { action: type, data: data }
    }));
});

export default class ChildProcess {
    static async spawn(cmd, args, config) {
        return await lib.run(null, 'childProcess', 'spawn', {
            cmd,
            args,
            ...config
        });
    };

    static async kill(targetCallID) {
        return await lib.run(null, 'childProcess', 'kill', targetCallID);
    };
};