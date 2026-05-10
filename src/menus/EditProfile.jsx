import "./EditProfile.css";

import { useState, useEffect } from "preact/hooks";
import Neutralino from "@neutralinojs/lib";
import { useManager } from "../utils/ManagerProvider.jsx";
import { showToast } from "../components/Toast.jsx";

import Button from "../components/Button.jsx";
import Textbox from "../components/Textbox.jsx";
import Select from "../components/Select.jsx";

import closeIcon from "../assets/buttons/close.svg";

export default function EditProfileMenu({ setMenu, profile, setProfile, reloadData }) {
    const Manager = useManager();

    const [ready, setReady] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [username, setUsername] = useState("");
    const [UID, setUID] = useState("");
    const [skin, setSkin] = useState(undefined);
    const [skinMode, setSkinMode] = useState("file");

    useEffect(() => {
        if (profile) setUsername(profile.username);
        if (profile) setUID(profile.uid);
    }, [profile]);

    const handleNewUID = () => {
        const newUid = Manager.utils.generateUID(); 
        setUID(newUid);
        showToast("Generated new UID");
    };

    const handleExport = async () => {
        try {
            const res = await Manager.profiles.export(profile.id);
            if(res === true) showToast("Exported successfully");
        } catch(e) {
            showToast("Export failed");
            console.error(e);
        };
    };

    const handleDelete = async () => {
        const confirmDelete = await Neutralino.os.showMessageBox("Delete Profile", `Are you sure you want to delete "${profile.username}" profile?`, "YES_NO", "WARNING");
        if (confirmDelete !== "YES") return;

        setProcessing(true);
        try {
            await Manager.profiles.delete(profile.id);
            await reloadData();
            setMenu('main');
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
            let skinDataURI = null;
            if (skinMode === "java") {
                showToast("Fetching Java Edition skin...");
                try {
                    const userRes = await fetch(`https://mcprofile.io/api/v1/java/username/${username}`);
                    if (!userRes.ok) throw new Error("User not found");
                    const userData = await userRes.json();
                    
                    if (userData?.skin) {
                        const skinRes = await fetch(userData.skin);
                        const skinBlob = await skinRes.blob();
                        
                        skinDataURI = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result);
                            reader.onerror = reject;
                            reader.readAsDataURL(skinBlob);
                        });
                    };// otherwise they use steve
                } catch (e) {
                    console.error(e);
                    showToast("Failed to fetch Java Edition skin");
                    skinData = undefined;
                };
            } else if (skinMode === "bedrock") {
                showToast("Fetching Bedrock Edition skin...");
                try {
                    const userRes = await fetch(`https://mcprofile.io/api/v1/bedrock/gamertag/${username}`);
                    if (!userRes.ok) throw new Error("User not found");
                    const userData = await userRes.json();
                    
                    if (userData?.skin) {
                        const skinRes = await fetch(userData.skin);
                        const skinBlob = await skinRes.blob();
                        
                        skinDataURI = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result);
                            reader.onerror = reject;
                            reader.readAsDataURL(skinBlob);
                        });
                    };// otherwise they use steve
                } catch (e) {
                    console.error(e);
                    showToast("Failed to fetch Bedrock Edition skin");
                    skinData = undefined;
                };
            } else if (skin) skinDataURI = skin;

            const updatedProfile = await Manager.profiles.update(profile.id, {
                username,
                uid: UID !== "" ? UID : undefined,
                ...(skinDataURI && { skin: skinDataURI })
            });

            await reloadData();
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
                        <Select
                            label="Skin Mode"
                            value={skinMode}
                            options={[
                                { label: "File", value: "file" },
                                { label: "Java Skin", value: "java" },
                                { label: "Bedrock Skin", value: "bedrock" }
                            ]}
                            onChange={(val) => setSkinMode(val)}
                        />
                        {skinMode === "file" ? (
                            <>
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
                            </>
                        ) : (skinMode === "java" ? (
                            <h2>Will use <b>{username || "Steve"}</b>'s Java Edition skin</h2>
                        ) : (
                            <h2>Will use <b>{username || "Steve"}</b>'s Bedrock Edition skin</h2>
                        ))}

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
            <div id="edit-profile-action-bar">
                <div id="profile-action-bar-group">
                    <Button id="delete-button" type="destructive" disabled={processing} pushable={!processing} onclick={handleDelete}>
                        Delete
                    </Button>
                    <Button type="destructive" disabled={processing} pushable={!processing} onclick={handleNewUID}>
                        New UID
                    </Button>
                </div>
                <div id="profile-action-bar-group">
                    <Button disabled={processing || !ready} pushable={!processing && ready} onclick={handleExport}>
                        Export
                    </Button>
                    <Button id="save-button" disabled={!ready || processing} pushable={ready && !processing} onclick={handleCreate}>
                        Save
                    </Button>
                </div>
            </div>
        </>
    );
};