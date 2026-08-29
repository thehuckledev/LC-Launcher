import "./Options.css";

import Neutralino from "@neutralinojs/lib";

import config from "../data/config.js";
import { useSettings } from "../utils/SettingsStore.jsx";

import { showToast } from "../components/Toast.jsx";
import { showAlert } from "../components/Alert.jsx";
import Textbox from "../components/Textbox.jsx";
import Button from "../components/Button.jsx";
import Slider from "../components/Slider.jsx";
import Checkbox from "../components/Checkbox.jsx";

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
                <h1>Options</h1>
                <div id="main-actions">
                    <Button id="back-button" onclick={() => setMenu('main')}>
                        <img id="back-icon" src={closeIcon} draggable={false} />
                    </Button>
                </div>
            </div>
            <div id="options">
                <div className="options-columns">
                    <div className="column-left">
                        <h2>General</h2>
                        <Checkbox
                            value={settings.discordRPC}
                            onchange={(state) => updateSetting('discordRPC', state)}
                            label="Discord RPC"
                        />
                        <Checkbox
                            value={settings.keepLauncherOpen}
                            onchange={(state) => updateSetting('keepLauncherOpen', state)}
                            label="Keep Launcher Open"
                        />
                        <Checkbox
                            value={settings.showFeaturedServers}
                            onchange={(state) => updateSetting('showFeaturedServers', state)}
                            label="Show Featured Servers"
                        />
                        <Checkbox
                            value={settings.universalControllerSupport}
                            onchange={(state) => updateSetting('universalControllerSupport', state)}
                            label="Universal Controller Support"
                        />
                        <Button onclick={() => setMenu("remapkeys")}>
                            Key Mappings
                        </Button>

                        <div id="options-spacer"></div>

                        <h2>User Interface</h2>
                        <Checkbox
                            value={settings.renderPanorama}
                            onchange={(state) => updateSetting('renderPanorama', state)}
                            label="Render Panoramas"
                        />
                        <Checkbox
                            value={settings.renderBGFade}
                            onchange={(state) => updateSetting('renderBGFade', state)}
                            label="Render BG Fade"
                        />

                        <div id="options-spacer"></div>

                        <h2>Audio</h2>
                        <Checkbox
                            value={settings.buttonClickSFX}
                            onchange={(state) => updateSetting('buttonClickSFX', state)}
                            label="Button Click SFX"
                        />
                        <Checkbox
                            value={settings.menuMusic}
                            onchange={(state) => updateSetting('menuMusic', state)}
                            label="Menu Music"
                        />
                        <Checkbox
                            value={settings.menuMusicPanning}
                            onchange={(state) => updateSetting('menuMusicPanning', state)}
                            label="Menu Music Panning"
                        />
                        <Slider
                            label={`Volume: ${settings.volume}%`}
                            min={0}
                            max={100}
                            step={5}
                            value={settings.volume}
                            onInput={(e) => updateSetting('volume', parseInt(e.target.value))}
                        />

                        <div id="options-spacer"></div>

                        <h2>Danger Zone</h2>
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
                            isFolderPicker={true}
                            onPick={async () => {
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
                            }}
                        />
                        <Button type="destructive" onclick={async () => {
                            let shouldDo = await showAlert('Confirm', 'Are you sure you want to erase all data?', "YES_NO");
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
                                let shouldDo = await showAlert('Confirm', 'Are you sure you want to uninstall?', "YES_NO");
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
                                            await lib.stop();
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
                                            await lib.stop();
                                            await Neutralino.app.exit();
                                        }, 200);*/
                                        const dataPath = await Neutralino.filesystem.getJoinedPath(settings.dataDirectory, "../");
                                        await Neutralino.filesystem.remove(dataPath);

                                        await showAlert('Uninstall', 'The application data has been removed, you will need to manually remove the app itself', "OK");

                                        showToast("Uninstalled, quitting...");
                                        setTimeout(async () => {
                                            if (window.whenQuitting) await window.whenQuitting();
                                            await lib.stop();
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
                    </div>
                    <div className="column-right">
                        <Button type="donate" onclick={() => Neutralino.os.open(config.donationLink)}>
                            Donate
                        </Button>
                        <Button type="discord" onclick={async() => {
                            for await (const inv of config.discordInvite) {
                                await Neutralino.os.open(inv);
                            };
                        }}>
                            Join the Discord
                        </Button>
                        <Button type="github" onclick={() => Neutralino.os.open(`https://github.com/${config.projectGithubUser}/${config.projectGithubRepo}`)}>
                            Open the Github
                        </Button>
                        <Button type="website" onclick={() => Neutralino.os.open(config.website)}>
                            Open the Website
                        </Button>

                        <Button onclick={() => setMenu("about")}>
                            About
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
};