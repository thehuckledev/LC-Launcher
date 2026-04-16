import "./Options.css";

import Neutralino from "@neutralinojs/lib";

import { useSettings } from "../utils/SettingsStore.jsx";
import { showToast } from "../components/Toast.jsx";

import Textbox from "../components/Textbox.jsx";
import Button from "../components/Button.jsx";

import closeIcon from "../assets/buttons/close.svg";

export default function OptionsMenu({ setMenu }) {
    const { settings, updateSetting, defaultSetting } = useSettings();

    async function dirPossible(path) {
        try {
            const stats = await Neutralino.filesystem.getStats(path);
            if (!stats.isDirectory) return false;
            return true;
        } catch(e) {
            if (e.code === "NE_FS_NOPATHE") {
                try {
                    await Neutralino.filesystem.createDirectory(path);
                    return true;
                } catch {
                    return false;
                };
            };
            return false;
        };
    };

    async function testPath(path) {
        try {
            const stats = await Neutralino.filesystem.getStats(path);
            if (stats.isDirectory !== true) return false;
            return true;
        } catch {
            return false;
        };
    };

    function incrementVolume() {
        if (typeof settings.volume !== 'number') return updateSetting('volume', 100);
        let val = settings.volume;
        val += 20;
        if (val > 100) val = 0;
        updateSetting('volume', val)
    };

    return (
        <>
            <div id="top-bar">
                <div></div>
                <div id="main-actions">
                    <Button id="back-button" onclick={() => setMenu('main')}>
                        <img id="back-icon" src={closeIcon} draggable={false} />
                    </Button>
                </div>
            </div>
            <div id="options">
                <Button onclick={() => updateSetting('discordRPC', !settings.discordRPC)}>
                    {settings.discordRPC == false ? 'Discord RPC: Disabled' : 'Discord RPC: Enabled'}
                </Button>
                <Button onclick={() => updateSetting('keepLauncherOpen', !settings.keepLauncherOpen)}>
                    {settings.keepLauncherOpen == false ? 'Keep Launcher Open: Disabled' : 'Keep Launcher Open: Enabled'}
                </Button>
                <Button onclick={() => updateSetting('fullscreen', !settings.fullscreen)}>
                    {settings.fullscreen == false ? 'Fullscreen: Disabled' : 'Fullscreen: Enabled'}
                </Button>
                <Button onclick={() => updateSetting('menuMusic', !settings.menuMusic)}>
                    {settings.menuMusic == false ? 'Menu Music: Disabled' : 'Menu Music: Enabled'}
                </Button>
                <Button onclick={() => incrementVolume()}>
                    Volume: {settings.volume}%
                </Button>
                <Textbox
                    id="data-path"
                    onchange={async (txt) => {
                        if (txt.trim() == "") {
                            await defaultSetting('dataDirectory');
                            return setTimeout(async() => await Neutralino.app.restartProcess(), 200);
                        };

                        const possible = await dirPossible(txt);
                        if (!possible) {
                            await defaultSetting('dataDirectory');
                            return setTimeout(async() => await Neutralino.app.restartProcess(), 200);
                        };

                        await updateSetting('dataDirectory', txt);
                        setTimeout(async() => await Neutralino.app.restartProcess(), 200);
                    }}
                    value={settings.dataDirectory}
                    placeholder="Data directory..."
                    label="Data Directory (Must Be Absolute)"
                    minlength={0}
                    maxlength={200}
                />
                <Button id="data-select" onclick={async () => {
                    const res = await Neutralino.os.showFolderDialog("Select data path");
                    if (!res) return;
                    const src = res;
                    if (!(await testPath(src))) {
                        showToast("Data path isn't a valid folder");
                        return setTimeout(async() => await Neutralino.app.restartProcess(), 200);
                    };
                    
                    const possible = await dirPossible(src);
                    if (!possible) {
                        await defaultSetting('dataDirectory');
                        return setTimeout(async() => await Neutralino.app.restartProcess(), 200);
                    };

                    await updateSetting('dataDirectory', src);
                    setTimeout(async() => await Neutralino.app.restartProcess(), 200);
                }}>
                    Select data path
                </Button>
                <Button type="destructive" onclick={async () => {
                    let shouldDo = await Neutralino.os
                                .showMessageBox('Confirm',
                                                'Are you sure you want to erase all data?',
                                                'YES_NO', 'WARNING');
                    if(shouldDo == 'YES') {
                        await Neutralino.filesystem.remove(settings.dataDirectory);
                        showToast("Erased data, restarting...");
                        setTimeout(async() => await Neutralino.app.restartProcess(), 200);
                    };
                }}>
                    Erase all data
                </Button>
                <Button type="destructive" onclick={async () => {
                    let shouldDo = await Neutralino.os
                                .showMessageBox('Confirm',
                                                'Are you sure you want to uninstall?',
                                                'YES_NO', 'WARNING');
                    if (shouldDo !== 'YES') return;

                    try {
                        const dataPath = await Neutralino.filesystem.getJoinedPath(settings.dataDirectory, "../");
                        await Neutralino.filesystem.remove(dataPath);

                        let appPath;
                        if (NL_OS === "Windows" || NL_OS === "Linux") // TODO make sure this works
                            appPath = NL_PATH;
                        else if (NL_OS === "Darwin")
                            appPath = await Neutralino.filesystem.getJoinedPath(NL_PATH, "../../");

                        await Neutralino.filesystem.remove(appPath);

                        showToast("Uninstalled, quitting...");
                        setTimeout(async () => {
                            if (window.whenQuitting) await window.whenQuitting();
                            if (window.beforeExitRPC) await window.beforeExitRPC();
                            await Neutralino.app.exit();
                        }, 200);
                    } catch (e) {
                        console.error(e);
                        showToast("Failed to uninstall");
                    };
                }}>
                    Uninstall
                </Button>
            </div>
        </>
    );
};