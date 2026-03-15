import "./Options.css";

import { useSettings } from "../utils/SettingsStore.jsx";

import Button from "../components/Button.jsx";

import closeIcon from "../assets/buttons/close.svg";

export default function OptionsMenu({ setMenu }) {
    const { settings, updateSetting } = useSettings();

    function incrementVolume() {
        if (!settings.volume || !Number.isInteger(parseInt(settings.volume))) return updateSetting('volume', '100');
        let val = parseInt(settings.volume);
        val += 20;
        if (val > 100) val = 0;
        updateSetting('volume', String(val))
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
                <Button onclick={() => updateSetting('fullscreen', String(!(settings.fullscreen == 'true')))}>
                    {settings.fullscreen == "false" ? 'Fullscreen: Disabled' : 'Fullscreen: Enabled'}
                </Button>
                <Button onclick={() => updateSetting('menuMusic', String(!(settings.menuMusic == 'true')))}>
                    {settings.menuMusic == "false" ? 'Menu Music: Disabled' : 'Menu Music: Enabled'}
                </Button>
                <Button onclick={() => incrementVolume()}>
                    Volume: {settings.volume}%
                </Button>
            </div>
        </>
    );
};