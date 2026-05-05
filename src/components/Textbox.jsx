import "./Textbox.css";

import { useRef, useEffect } from "preact/hooks";
import { showToast } from "./Toast";

export default function Textbox({ id, onchange = (txt) => { }, value = "", placeholder = "", label = "Textbox", minlength = 0, maxlength = 30 }) {
    return (
        <div class="mc-textbox">
            <label for={id}>{label}</label>
            <input
                type="text"
                id={id}
                value={value}
                placeholder={placeholder}
                maxLength={maxlength}
                spellCheck="false" 
                autoCorrect="off"
                autoCapitalize="off"
                autoComplete="off"
                aria-autocomplete="none"
                onBlur={(e) => {
                    if (
                        e.target.value.trim().length >= minlength &&
                        e.target.value.trim().length <= maxlength
                    ) onchange(e.target.value);
                    else {
                        showToast(`Textbox requires minimum ${minlength} characters`);
                        onchange("");
                    };
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') e.target.blur();
                }}
            />
        </div>
    );
};