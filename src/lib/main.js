// BunExtension
//
// Run BunExtension functions by sending dispatched event messages.
//
// (c)2023-2023 Harald Schneider - marketmix.com

import Neutralino from "@neutralinojs/lib";

const pendingCalls = new Map();

class lcLib {
    constructor(debug=false) {
        this.version = '1.0.1';
        this.debug = debug;

        Neutralino.events.on('bunResponse', (event) => {
            const { callID, success, result, error } = event.detail;

            if (!pendingCalls.has(callID)) return;
            const { resolve, reject } = pendingCalls.get(callID);
            pendingCalls.delete(callID);

            if (success) resolve(result);
            else reject(new Error(error));
        });

        if(NL_MODE !== 'window') {
            window.addEventListener('beforeunload', function (e) {
                e.preventDefault();
                e.returnValue = '';
                lib.stop();
                return '';
            });
        };
    };

    async run(id = null, c, f, ...a) {
        //
        // Call a BunExtension function.

        let ext = 'lcLib';
        let event = 'runBun';
        let callID = id || crypto.randomUUID();

        let data = {
            callID,
            class: c,
            function: f,
            args: a
        };

        if(this.debug) {
            console.log(`EXT_BUN: Calling ${ext}.${event} : ` + JSON.stringify(data));
        };

        return new Promise(async (resolve, reject) => {
            pendingCalls.set(callID, { resolve, reject });
            await Neutralino.extensions.dispatch(ext, event, data);
        });
    };

    async stop() {
        //
        // Stop and quit the Bun-extension and its parent app.
        // Use this if Neutralino runs in Cloud-Mode.

        let ext = 'lcLib';
        let event = 'appClose';

        if(this.debug) {
            console.log(`EXT_BUN: Calling ${ext}.${event}`);
        };
        await Neutralino.extensions.dispatch(ext, event, "");
        await Neutralino.app.exit();
    };
};

export default lcLib;