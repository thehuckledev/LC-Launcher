import "./Setup.css";

import { useState } from "preact/hooks";
import Neutralino from "@neutralinojs/lib";
import { showToast } from "../components/Toast.jsx";

import Button from "../components/Button.jsx";
import Textbox from "../components/Textbox.jsx";

import minecraftLogo from "../assets/minecraftlogo.png";

export default function SetupMenu({ setMenu }) {
    const [ready, setReady] = useState(false);
    const [username, setUsername] = useState("");

    return (
        <>
            <img id="setup-logo" src={minecraftLogo} draggable={false} />
            <div id="setup">
                <h1 class="moto">Welcome to
                    <div class="slidingVertical">
                        <span>LC Launcher</span>
                        <span>Legacy Community Launcher</span>
                        <span>LCE Launcher</span>
                    </div>
                </h1>
                <Textbox
                    id="chosen-username"
                    onchange={async (txt) => {
                        if (txt.trim() === "" || !(/^[a-zA-Z0-9_]{3,16}$/.test(txt.trim()))) return setReady(false);
                        else showToast("Your username must only have letters, numbers");
                        setUsername(txt.trim());
                        setReady(true);
                    }}
                    value={username}
                    placeholder="Steve..."
                    label="Enter your username"
                    minlength={3}
                    maxlength={16}
                />
                <br /><br />
                <h2>A community made fork will be automatically added as an instance.</h2>
                <h2>If you don't want it, you can simply remove it.</h2>
            </div>
            <div id="action-bar">
                <Button id="skip-button" onclick={() => setMenu('main')}>
                    Skip Setup
                </Button>
                <Button id="done-button" disabled={!ready} onclick={() => {
                    if(ready) setMenu('main');
                    else showToast("You need to enter a username or skip");
                }}>
                    Done
                </Button>
            </div>
        </>
    );
};