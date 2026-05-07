import "./Button.css";

import { useState, useRef, useEffect } from "preact/hooks";

import clickSfx from "../assets/sfx/minecraft_click.opus";

import { useSettings } from "../utils/SettingsStore.jsx";

const sound = new Audio(clickSfx);
sound.preload = "auto";

export default function Button({ id = "", type="normal", disabled = false, pushable = true, borderless = false, tooltip = "", tooltipAlign = "RIGHT", onclick = () => {}, children }) {
    const { settings } = useSettings();

    const [showTooltip, setShowTooltip] = useState(false);
    const timeoutRef = useRef(null);

    const handleMouseEnter = () => {
        if (!tooltip) return;
        timeoutRef.current = setTimeout(() => setShowTooltip(true), 800); 
    };

    const handleMouseLeave = () => {
        clearTimeout(timeoutRef.current);
        setShowTooltip(false);
    };

    return (
        <div id={id} type={type} class={`mc-button ${borderless ? "borderless" : ""}`} disabled={disabled} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onclick={(e) => {
            if (pushable === false) return;

            const click = sound.cloneNode();
            click.volume = (settings?.volume ?? 100) / 100;
            click.play().catch(err => console.error("Btn click sfx failed:", err));
            click.onended = () => click.remove();

            onclick(e);
        }}>
            <div class="title">
                {children}
            </div>
            {(tooltip && showTooltip) && <span className={`mc-tooltip-text aligned-${tooltipAlign}`}>{tooltip}</span>}
        </div>
    );
};