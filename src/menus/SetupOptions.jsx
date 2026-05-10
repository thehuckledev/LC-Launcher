import "./SetupOptions.css";

import { useSettings } from "../utils/SettingsStore.jsx";
import Button from "../components/Button.jsx";

export default function SetupOptionsMenu({ setMenu }) {
    const { settings, updateSetting } = useSettings();

    // TODO add data dir option

    return (
        <>
            <div id="setupOptions">
                <h1 class="moto">Welcome to
                    <div class="slidingVertical">
                        <span>LC Launcher</span>
                        <span>Legacy Community Launcher</span>
                        <span>LCE Launcher</span>
                    </div>
                </h1>
                <h2>Setup options. You may edit these later as well!</h2>
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
                <Button onclick={() => updateSetting('menuMusicPanning', !settings.menuMusicPanning)}>
                    {settings.menuMusicPanning == false ? 'Menu Music Panning: Disabled' : 'Menu Music Panning: Enabled'}
                </Button>
            </div>
            <div id="setupOptions-action-bar">
                <div></div>
                <Button id="done-button" onclick={() => setMenu('main')}>
                    Done
                </Button>
            </div>
        </>
    );
};