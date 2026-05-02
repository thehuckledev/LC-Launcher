import "./EditProfile.css";

import { useState, useEffect } from "preact/hooks";
import Neutralino from "@neutralinojs/lib";
import { useManager } from "../utils/ManagerProvider.jsx";
import { showToast } from "../components/Toast.jsx";

import Button from "../components/Button.jsx";
import Textbox from "../components/Textbox.jsx";

import closeIcon from "../assets/buttons/close.svg";

export default function EditProfileMenu({ setMenu, profile, setProfile }) {
    const Manager = useManager();

    const [ready, setReady] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [username, setUsername] = useState("");
    const [skin, setSkin] = useState(undefined);

    useEffect(() => {
        if (profile) setUsername(profile.username);
    }, [profile]);

    const handleDelete = async () => {
        const confirmDelete = await Neutralino.os.showMessageBox("Delete Profile", `Are you sure you want to delete "${profile.username}" profile?`, "YES_NO", "WARNING");
        if (confirmDelete !== "YES") return;

        setProcessing(true);
        try {
            await Manager.profiles.delete(profile.id);
            
            const leftoverProfiles = await Manager.profiles.list();
            if (leftoverProfiles.length > 0) {
                setProfile(leftoverProfiles[0]);
                setMenu('main');
            } else {
                setProfile(null);
                setMenu('main');
            };
        } catch (err) {
            showToast("Failed to delete profile: " + err.message);
        } finally {
            setProcessing(false);
        };
    };

    const handleCreate = async () => {
        if (!ready) return showToast("You need to enter a valid username");

        setProcessing(true);
        try {
            const updatedProfile = await Manager.profiles.update(profile.id, {
                username: username,
                ...(skin && { skin: skin })
            });

            setProfile(updatedProfile);
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
                <h1>Edit Profile</h1>
                <div id="main-actions">
                    <Button id="back-button" onclick={() => setMenu('main')}>
                        <img id="back-icon" src={closeIcon} draggable={false} />
                    </Button>
                </div>
            </div>
            <div id="edit-profile">
                {processing ? (
                    <h2>Saving profile changes...</h2>
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
                        <h2>If you don't select a new skin it will use your last skin.</h2>
                    </>
                )}
            </div>
            <div id="edit-profile-action-bar">
                <Button id="delete-button" type="destructive" disabled={processing} pushable={!processing} onclick={handleDelete}>
                    Delete
                </Button>
                <Button id="save-button" disabled={!ready || processing} pushable={ready && !processing} onclick={handleCreate}>
                    Save
                </Button>
            </div>
        </>
    );
};