import "./Button.css";

import clickSfx from "../assets/sfx/minecraft_click.opus";

import { useSettings } from "../utils/SettingsStore.jsx";

const sound = new Audio(clickSfx);

export default function Button({ id = "", type="normal", disabled = false, pushable = true, borderless = false, onclick = () => {}, children }) {
    const { settings } = useSettings();

    return (
        <div id={id} type={type} class={`mc-button ${borderless ? "borderless" : ""}`} disabled={disabled} onclick={(e) => {
            if (pushable === false) return;
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