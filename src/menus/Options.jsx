import "./Options.css";

import Neutralino from "@neutralinojs/lib";

import { useSettings } from "../utils/SettingsStore.jsx";
import { showToast } from "../components/Toast.jsx";

import Textbox from "../components/Textbox.jsx";
import Button from "../components/Button.jsx";
import Slider from "../components/Slider.jsx";

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
                <Button onclick={() => updateSetting('showFeaturedServers', !settings.showFeaturedServers)}>
                    {settings.showFeaturedServers == false ? 'Show Featured Servers: Disabled' : 'Show Featured Servers: Enabled'}
                </Button>
                <Button onclick={() => updateSetting('buttonClickSFX', !settings.buttonClickSFX)}>
                    {settings.buttonClickSFX == false ? 'Button Click SFX: Disabled' : 'Button Click SFX: Enabled'}
                </Button>
                <Button onclick={() => updateSetting('menuMusic', !settings.menuMusic)}>
                    {settings.menuMusic == false ? 'Menu Music: Disabled' : 'Menu Music: Enabled'}
                </Button>
                <Button onclick={() => updateSetting('menuMusicPanning', !settings.menuMusicPanning)}>
                    {settings.menuMusicPanning == false ? 'Menu Music Panning: Disabled' : 'Menu Music Panning: Enabled'}
                </Button>
                <Slider
                    label={`Volume: ${settings.volume}%`}
                    min={0}
                    max={100}
                    step={5}
                    value={settings.volume}
                    onInput={(e) => updateSetting('volume', parseInt(e.target.value))}
                />

                <div id="options-spacer"></div>

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
                {!NL_PORTABLE &&
                    <Button type="destructive" onclick={async () => {
                        let shouldDo = await Neutralino.os
                                    .showMessageBox('Confirm',
                                                    'Are you sure you want to uninstall?',
                                                    'YES_NO', 'WARNING');
                        if (shouldDo !== 'YES') return;

                        try {
                            if (NL_OS === "Windows") {
                                const appPath = NL_PATH.replace(/\//g, '\\');
                                const uninstallerPath = `${appPath}\\Uninstall.exe`;
                                await Neutralino.os.execCommand(`cmd /c start /b "" "${uninstallerPath}"`);
                                await Neutralino.app.exit();
                            } else if (NL_OS === "Darwin") {
                                const dataPath = await Neutralino.filesystem.getJoinedPath(settings.dataDirectory, "../");
                                const appPath = await Neutralino.filesystem.getJoinedPath(NL_PATH, "../../");

                                await Neutralino.filesystem.remove(dataPath);
                                await Neutralino.filesystem.remove(appPath);

                                showToast("Uninstalled, quitting...");
                                setTimeout(async () => {
                                    if (window.whenQuitting) await window.whenQuitting();
                                    if (window.beforeExitRPC) await window.beforeExitRPC();
                                    await Neutralino.app.exit();
                                }, 200);
                            } else if (NL_OS === "Linux") {
                                /*try {
                                    const home = await Neutralino.os.getEnv('HOME');
                                    const desktopFolder = `${home}/.local/share/applications`;
                                    const shortcutPath = `${desktopFolder}/${NL_APPID}.desktop`;

                                    await Neutralino.filesystem.getStats(shortcutPath);
                                    await Neutralino.filesystem.remove(shortcutPath);
                                } catch (err) {
                                    if (err.code === 'NE_FS_NOPATHE') console.log("Linux shortcut never existed");
                                    else console.error("Error removing linux shortcut:", err);
                                };

                                const appPath = NL_PATH;
                                await Neutralino.filesystem.remove(appPath);

                                showToast("Uninstalled, quitting...");
                                setTimeout(async () => {
                                    if (window.whenQuitting) await window.whenQuitting();
                                    if (window.beforeExitRPC) await window.beforeExitRPC();
                                    await Neutralino.app.exit();
                                }, 200);*/
                                const dataPath = await Neutralino.filesystem.getJoinedPath(settings.dataDirectory, "../");
                                await Neutralino.filesystem.remove(dataPath);

                                await Neutralino.os.showMessageBox('Uninstall', 'The application data has been removed, you will need to manually remove the app itself');

                                showToast("Uninstalled, quitting...");
                                setTimeout(async () => {
                                    if (window.whenQuitting) await window.whenQuitting();
                                    if (window.beforeExitRPC) await window.beforeExitRPC();
                                    await Neutralino.app.exit();
                                }, 200);
                            };
                        } catch (e) {
                            console.error(e);
                            showToast("Failed to uninstall");
                        };
                    }}>
                        Uninstall
                    </Button>
                }
                <Button onclick={async () => setMenu("about")}>
                    About
                </Button>
            </div>
        </>
    );
};