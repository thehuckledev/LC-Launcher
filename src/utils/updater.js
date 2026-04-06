import Neutralino from "@neutralinojs/lib";
import config from "../data/config.js";

export const checkForUpdates = async() => {
    if (NL_ARGS.includes("--neu-dev-extension")) return console.log("Update check bypassed, dev mode is on!");
    if (navigator.onLine === false) return;

    try {
        let manifest = await Neutralino.updater.checkForUpdates(config.updateURL);

        if (manifest.version != NL_APPVERSION) {
            let button = await Neutralino.os
                .showMessageBox('LC Launcher Update',
                                `Would you like to update LC Launcher?

From v${NL_APPVERSION} to v${manifest.version}${manifest.data.release_notes ? `\n\nRelease Notes:\n${manifest.data.release_notes}` : ""}`,
                                'YES_NO', 'QUESTION');
            if (button == 'YES') {
                await Neutralino.updater.install();
                await Neutralino.app.restartProcess();
            };
        } else {
            console.log("LC Launcher is up to date!");
        };
    } catch (err) {
        console.error(err);
    };
};