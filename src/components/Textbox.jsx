import "./Textbox.css";

export default function Textbox({ id, onchange = (txt) => { }, value = "", placeholder = "", label = "Textbox", minlength = 0, maxlength = 30 }) {
    return (
        <div class="mc-textbox">
            <label for={id}>{label}</label>
            <input
                type="text"
                id={id}
                value={value}
                placeholder={placeholder}
                minLength={minlength}
                maxLength={maxlength}
                onBlur={(e) => {
                    if (
                        e.target.value.trim().length >= minlength &&
                        e.target.value.trim().length <= maxlength
                    ) onchange(e.target.value);
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' &&
                        e.target.value.trim().length >= minlength &&
                        e.target.value.trim().length <= maxlength
                    ) {
                        e.target.blur();
                        onchange(e.target.value);
                    };
                }}
            />
        </div>
    );
};