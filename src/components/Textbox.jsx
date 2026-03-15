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
                minlength={minlength}
                maxlength={maxlength}
                onInput={(e) => onchange(e.target.value)}
            />
        </div>
    );
};