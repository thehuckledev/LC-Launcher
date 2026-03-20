import "./Setup.css";

import { useState } from "preact/hooks";
import Neutralino from "@neutralinojs/lib";
import { useManager } from "../utils/ManagerProvider.jsx";
import { showToast } from "../components/Toast.jsx";

import Button from "../components/Button.jsx";
import Textbox from "../components/Textbox.jsx";

import minecraftLogo from "../assets/ui/minecraftlogo.png";

import { defaultInstance } from "../data/defaultInstance.js";

export default function SetupMenu({ setMenu }) {
    const Manager = useManager();

    const [ready, setReady] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [username, setUsername] = useState("");
    const [skin, setSkin] = useState(undefined);

    const makeDefaultInstance = async () => {
        await Manager.instances.create(
            defaultInstance.repo,
            defaultInstance.tag,
            defaultInstance.exec,
            defaultInstance.target
        );
    };

    const handleNext = async () => {
        if (!ready) return showToast("You need to enter a valid username");

        setProcessing(true);
        try {
            const file = await Neutralino.filesystem.readBinaryFile(skin);
            const base64String = btoa(
                new Uint8Array(file)
                    .reduce((data, byte) => data + String.fromCharCode(byte), '')
            );

            let mimeType = 'image/png';
            if (skin.endsWith('.jpg') || skin.endsWith('.jpeg'))
                mimeType = 'image/jpeg';
            
            const skinDataURI = `data:${mimeType};base64,${base64String}`;
            await Manager.profiles.create(username, skinDataURI);

            // make inst
            await makeDefaultInstance();

            await Neutralino.storage.setData('hasSetup', JSON.stringify(true));

            showToast("Setup saved and completed");
            setMenu('main');
        } catch (err) {
            console.error(err);
            showToast("Failed to save setup: " + err.message);
        } finally {
            setProcessing(false);
        };
    };

    async function testPath(path) {
        try {
            await Neutralino.filesystem.getStats(path);
            return true;
        } catch {
            return false;
        };
    };

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
                {processing ? (
                    <h2>Setting up your launcher...</h2>
                ) : (
                    <>
                        <Textbox
                            id="chosen-username"
                            onchange={async (txt) => {
                                if (txt.trim() === "") return setReady(false);
                                if (/^[a-zA-Z0-9_]{3,16}$/.test(txt.trim())) {
                                    showToast("Your username must only have letters, numbers");
                                    return setReady(false);
                                };
                                setUsername(txt.trim());
                                setReady(true);
                            }}
                            value={username}
                            placeholder="Steve..."
                            label="Enter your username"
                            minlength={3}
                            maxlength={16}
                        />
                        <div id="skin-box">
                            <Textbox
                                id="skin-path"
                                onchange={async (txt) => {
                                    if (txt.trim() === "") return setSkin(undefined);

                                    if (!(await testPath(txt))) {
                                        showToast("Couldn't find skin from path");
                                        return setSkin(undefined);
                                    };

                                    if (!txt.endsWith(".jpg") &&
                                        !txt.endsWith(".jpeg") &&
                                        !txt.endsWith(".png")) {
                                        setSkin(undefined);
                                        return showToast("Please select a valid skin file");
                                    };

                                    //check if its a skin
                                    const buff = await Neutralino.filesystem.readBinaryFile(txt);
                                    if (!(await Manager.skins.isSkin(buff))) {
                                        setSkin(undefined);
                                        return showToast("The file you specified wasn't a valid skin file");
                                    };

                                    setSkin(txt.trim());
                                }}
                                value={skin}
                                placeholder="Skin path..."
                                label="Enter your skin's path"
                                minlength={3}
                                maxlength={150}
                            />
                            <Button id="skin-select" onclick={async () => {
                                const res = await Neutralino.os.showOpenDialog(
                                    "Select a skin",
                                    {
                                        multiSelections: false,
                                        filters: [
                                            {name: 'Images', extensions: ['jpg', 'jpeg', 'png']},
                                        ]
                                    }
                                );
                                if (!res || res.length === 0) return;
                                const src = res[0].trim();
                                if (!src.endsWith(".jpg") &&
                                    !src.endsWith(".jpeg") &&
                                    !src.endsWith(".png"))
                                    return showToast("Please select a valid skin file"); // extra check as sometimes a file explorer bypasses filter

                                if (!(await testPath(src))) 
                                    return showToast("Couldn't find skin from path");
                                
                                //check if its a skin
                                const buff = await Neutralino.filesystem.readBinaryFile(src);
                                if (!(await Manager.skins.isSkin(buff)))
                                    return showToast("The file you specified wasn't a valid skin file");

                                setSkin(src);
                            }}>
                                Choose a Skin
                            </Button>
                        </div>
                        <br /><br />
                        <h2>A community made fork will be automatically added as an instance.</h2>
                        <h2>If you don't want it, you can simply remove it.</h2>
                    </>
                )}
            </div>
            <div id="action-bar">
                <Button id="skip-button" disabled={processing} onclick={async() => {
                    await Neutralino.storage.setData('hasSetup', JSON.stringify(true));
                    setMenu('main');
                }}>
                    Skip Setup
                </Button>
                <Button id="done-button" disabled={!ready || processing} onclick={handleNext}>
                    Done
                </Button>
            </div>
        </>
    );
};