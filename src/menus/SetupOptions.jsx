import "./SetupOptions.css";

import { useSettings } from "../utils/SettingsStore.jsx";
import Button from "../components/Button.jsx";
import Slider from "../components/Slider.jsx";
import Checkbox from "../components/Checkbox.jsx";

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
                <div id="setupOptionsContainer">
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
                </div>
            </div>
            <div id="setupOptions-action-bar">
                <div></div>
                <Button id="next-button" onclick={() => setMenu('setuplinks')}>
                    Next
                </Button>
            </div>
        </>
    );
};