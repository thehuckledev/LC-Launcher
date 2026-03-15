import "./Button.css";

export default function Button({ id = "", onclick = () => {}, children }) {
    return (
        <div id={id} class="mc-button" onclick={onclick}>
            <div class="title">
                {children}
            </div>
        </div>
    );
};