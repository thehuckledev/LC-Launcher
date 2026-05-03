import "./Button.css";

import { useState, useRef } from "preact/hooks";

import clickSfx from "../assets/sfx/minecraft_click.opus";

import { useSettings } from "../utils/SettingsStore.jsx";

const sound = new Audio(clickSfx);

export default function Button({ id = "", type="normal", disabled = false, pushable = true, borderless = false, tooltip = "", tooltipAlign = "RIGHT", onclick = () => {}, children }) {
    const { settings } = useSettings();

    const [showTooltip, setShowTooltip] = useState(false);
    const timeoutRef = useRef(null);

    const handleMouseEnter = () => {
        if (!tooltip) return;

        timeoutRef.current = setTimeout(() => {
            setShowTooltip(true);
        }, 800); 
    };

    const handleMouseLeave = () => {
        clearTimeout(timeoutRef.current);
        setShowTooltip(false);
    };

    return (
        <div id={id} type={type} class={`mc-button ${borderless ? "borderless" : ""}`} disabled={disabled} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onclick={(e) => {
            if (pushable === false) return;
            sound.volume = settings.volume / 100;
            sound.currentTime = 0;
            sound.play();
            onclick(e);
        }}>
            <div class="title">
                {children}
            </div>
            {(tooltip && showTooltip) && <span className={`mc-tooltip-text aligned-${tooltipAlign}`}>{tooltip}</span>}
        </div>
    );
};