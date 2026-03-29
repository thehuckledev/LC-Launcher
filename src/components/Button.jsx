import "./Button.css";

import clickSfx from "../assets/sfx/minecraft_click.mp3";

import { useSettings } from "../utils/SettingsStore.jsx";

export default function Button({ id = "", disabled = false, pushable = true, onclick = () => {}, children }) {
    const { settings } = useSettings();

    return (
        <div id={id} class="mc-button" disabled={disabled} onclick={(e) => {
            if (pushable === false) return;
            const sound = new Audio(clickSfx);
            sound.volume = settings.volume / 100;
            sound.play();
            onclick(e);
        }}>
            <div class="title">
                {children}
            </div>
        </div>
    );
};