import "./Checkbox.css";

export default function Checkbox({ id, onchange = (state) => { }, value = false, label = "Textbox" }) {
    return (
        <div class="mc-checkbox">
            <input
                type="checkbox"
                id={id}
                checked={value}
                onChange={(e) => {
                    onchange(e.target.checked);
                }}
            />
            <label for={id}>{label}</label>
        </div>
    );
};