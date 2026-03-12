// code modified from https://github.com/binaryfunt/electron-seamless-titlebar-tutorial. all credit given
import * as Neutralino from "../vendor/neutralino/neutralino.mjs";

if (document.getElementById('min-button'))
    document.getElementById('min-button').addEventListener("click", event => Neutralino.window.minimize());

if (document.getElementById('max-button'))
    document.getElementById('max-button').addEventListener("click", event => {
        if (NL_OS === 'Darwin') return Neutralino.window.setFullScreen(true);
        Neutralino.window.maximize();
    });

if (document.getElementById('restore-button'))
    document.getElementById('restore-button').addEventListener("click", event => {
        if (NL_OS === 'Darwin') return Neutralino.window.setFullScreen(false);
        Neutralino.window.unmaximize();
    });

if (document.getElementById('close-button'))
    document.getElementById('close-button').addEventListener("click", event => Neutralino.app.exit());

toggleMaxRestoreButtons();
Neutralino.events.on('windowMaximize', toggleMaxRestoreButtons);
Neutralino.events.on('windowRestore', toggleMaxRestoreButtons);
Neutralino.events.on('windowFullScreenEnter', toggleMaxRestoreButtons);
Neutralino.events.on('windowFullScreenLeave', toggleMaxRestoreButtons);

async function toggleMaxRestoreButtons() {
    if ((
        await Neutralino.window.isMaximized() &&
        NL_OS !== 'Darwin'
    ) ||
        await Neutralino.window.isFullScreen()) {

        document.body.classList.add('maximized');
    } else {
        document.body.classList.remove('maximized');
    };
};