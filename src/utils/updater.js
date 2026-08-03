import Neutralino from "@neutralinojs/lib";
import config from "../data/config.js";

import { showAlert } from "../components/Alert.jsx";
import Net from "../lib/net.js";

const isVersionGreater = (latest, current) => {
    const clean = (v) => v.split("-")[0].replace("v", "").split(".").map(Number);
    const [l1, l2, l3] = clean(latest);
    const [c1, c2, c3] = clean(current);

    if (l1 !== c1) return l1 > c1;
    if (l2 !== c2) return l2 > c2;
    return l3 > c3;
};

export const checkForUpdates = async() => {
    const latestRelease = await Net.get(`https://api.github.com/repos/${config.projectGithubUser}/${config.projectGithubRepo}/releases/latest`, {
        headers: {
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2026-03-10'
        }
    });

    if (latestRelease?.ok !== true) {
        console.error("Failed to check for updates:", data);
        return showToast("Error: Failed to check for updates");
    };

    if (!isVersionGreater(latestRelease?.data?.tag_name, NL_APPVERSION))
        return console.log("LC Launcher is up to date!");

    let openPage = await showAlert(
        'LC Launcher Update',
        `Would you like to update LC Launcher?

From v${NL_APPVERSION} to ${latestRelease?.data?.tag_name}${latestRelease?.data?.body ? `\n\nRelease Notes:\n${latestRelease?.data?.body}` : ""}`,
        'YES_NO',
        "LEFT"
    );
    if (openPage === 'YES') {
        await Neutralino.os.open(latestRelease?.data?.html_url);

        if (window.whenQuitting) await window.whenQuitting();
        await lib.stop();
        await Neutralino.app.exit();
    };

    // No auto update for now, needs a whole rework and currently people are being blocked leading to frozen setup screen
    /*if (NL_ARGS.includes("--neu-dev-extension")) return console.log("Update check bypassed, dev mode is on!");
    if (navigator.onLine === false) return;

    try {
        let manifest = await Neutralino.updater.checkForUpdates(config.updateURL);

        if (manifest.version != NL_APPVERSION) {
            let button = await showAlert('LC Launcher Update',
                                `Would you like to update LC Launcher?

From v${NL_APPVERSION} to v${manifest.version}${manifest.data.release_notes ? `\n\nRelease Notes:\n${manifest.data.release_notes}` : ""}`,
                                'YES_NO');
            if (button == 'YES') {
                await Neutralino.updater.install();
                await Neutralino.app.restartProcess();
            };
        } else {
            console.log("LC Launcher is up to date!");
        };
    } catch (err) {
        console.error(err);
    };*/
};