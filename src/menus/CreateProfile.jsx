import "./CreateProfile.css";

import { useState } from "preact/hooks";
import Neutralino from "@neutralinojs/lib";
import { useManager } from "../utils/ManagerProvider.jsx";
import { showToast } from "../components/Toast.jsx";

import Button from "../components/Button.jsx";
import Textbox from "../components/Textbox.jsx";

import closeIcon from "../assets/buttons/close.svg";

export default function CreateProfileMenu({ setMenu, setProfile, reloadData }) {
    const Manager = useManager();

    const [ready, setReady] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [username, setUsername] = useState("");
    const [UID, setUID] = useState("");
    const [skin, setSkin] = useState(undefined);

    const handleCreate = async () => {
        if (!ready) return showToast("You need to enter a valid username");

        setProcessing(true);
        try {
            let newProfile;
            if (skin) newProfile = await Manager.profiles.create(username, skin, UID !== "" ? UID : undefined);
            else newProfile = await Manager.profiles.create(username, undefined, UID !== "" ? UID : undefined);

            await reloadData();
            setProfile(newProfile);
            setMenu('main');
        } catch (err) {
            console.error(err);
            showToast("Failed to create profile: " + err.message);
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
            <div id="top-bar">
                <h1>Create Profile</h1>
                <div id="main-actions">
                    <Button id="back-button" onclick={() => setMenu('main')}>
                        <img id="back-icon" src={closeIcon} draggable={false} />
                    </Button>
                </div>
            </div>
            <div id="create-profile">
                {processing ? (
                    <h2>Creating your profile...</h2>
                ) : (
                    <>
                        <Textbox
                            id="chosen-username"
                            onchange={async (txt) => {
                                if (txt.trim() === "") return setReady(false);
                                if (!(/^[a-zA-Z0-9_]{3,16}$/.test(txt.trim()))) {
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
                        <h2>Your skin will default to steve if you don't select one.</h2>

                        <Textbox
                            id="chosen-uid"
                            onchange={async (txt) => {
                                if (txt.trim() === "") return setUID("");
                                if (!(/^0x[0-9A-F]{16}$/i.test(txt.trim()))) {
                                    showToast("Invalid UID Format");
                                    return setUID("");
                                };
                                setUID(txt.trim());
                            }}
                            value={UID}
                            placeholder="0xC1B71FF5E39BB126..."
                            label="Enter a UID (Optional)"
                            minlength={18}
                            maxlength={18}
                        />
                    </>
                )}
            </div>
            <div id="create-profile-action-bar">
                <div></div>
                <Button id="done-button" disabled={!ready || processing} pushable={ready && !processing} onclick={handleCreate}>
                    Done
                </Button>
            </div>
        </>
    );
};