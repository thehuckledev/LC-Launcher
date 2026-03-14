import "./Options.css";

import { useSettings } from "../utils/SettingsStore.jsx";

import Button from "../components/Button.jsx";

export default function OptionsMenu({ setMenu }) {
    const { settings, updateSetting } = useSettings();

    return (
        <>
            <div id="top-bar">
                <div></div>
                <div id="main-actions">
                    <Button id="back-button" onclick={() => setMenu('main')}>
                        <img id="back-icon" src="./assets/buttons/close.svg" draggable={false} />
                    </Button>
                </div>
            </div>
            <Button id="back-button" onclick={() => updateSetting('menuMusic', 'true')}>
                Enable Music
            </Button>
            <Button id="back-button" onclick={() => updateSetting('menuMusic', 'false')}>
                Disable Music
            </Button>
        </>
    );
};