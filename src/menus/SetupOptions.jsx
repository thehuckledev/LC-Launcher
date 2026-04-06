import "./Setup.css";

import { useSettings } from "../utils/SettingsStore.jsx";
import Button from "../components/Button.jsx";

import minecraftLogo from "../assets/ui/minecraftlogo.png";

export default function SetupOptionsMenu({ setMenu }) {
    const { settings, updateSetting } = useSettings();

    // TODO add discord rpc option
    // TODO add data dir option

    return (
        <>
            <img id="setup-logo" src={minecraftLogo} draggable={false} />
            <div id="setup">
                <h1 class="moto">Welcome to
                    <div class="slidingVertical">
                        <span>LC Launcher</span>
                        <span>Legacy Community Launcher</span>
                        <span>LCE Launcher</span>
                    </div>
                </h1>
                <h2>Setup options. You may edit these later as well!</h2>
                <Button onclick={() => updateSetting('keepLauncherOpen', !settings.keepLauncherOpen)}>
                    {settings.keepLauncherOpen == false ? 'Keep Launcher Open: Disabled' : 'Keep Launcher Open: Enabled'}
                </Button>
                <Button onclick={() => updateSetting('fullscreen', !settings.fullscreen)}>
                    {settings.fullscreen == false ? 'Fullscreen: Disabled' : 'Fullscreen: Enabled'}
                </Button>
                <Button onclick={() => updateSetting('menuMusic', !settings.menuMusic)}>
                    {settings.menuMusic == false ? 'Menu Music: Disabled' : 'Menu Music: Enabled'}
                </Button>
            </div>
            <div id="action-bar">
                <div></div>
                <Button id="done-button" onclick={() => setMenu('main')}>
                    Done
                </Button>
            </div>
        </>
    );
};