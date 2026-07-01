import "./Slider.css";

import { useSettings } from "../utils/SettingsStore.jsx";

import clickSfx from "../assets/sfx/press.flac";

const sound = new Audio(clickSfx);
sound.preload = "auto";

export default function Slider({ id, label, min = 0, max = 100, step = 1, value, onInput }) {
    const { settings } = useSettings();

    const playClick = () => {
        if (!settings.buttonClickSFX) return;

        const click = sound.cloneNode();
        click.volume = (settings?.volume ?? 100) / 100;
        click.play().catch(err => console.error("Slider sfx failed:", err));
    };

    return (
        <div class="mc-slider-container">
            <input 
                id={id}
                type="range"
                class="mc-slider"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={onInput}
                onMouseDown={playClick}
            />
            <div class="mc-slider-label">
                {label}
            </div>
        </div>
    );
};