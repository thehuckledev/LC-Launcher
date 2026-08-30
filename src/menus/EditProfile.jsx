import "./EditProfile.css";

import { useState, useEffect } from "preact/hooks";
import Neutralino from "@neutralinojs/lib";
import { useManager } from "../utils/ManagerProvider.jsx";
import Net from "../lib/net.js";

import { showToast } from "../components/Toast.jsx";
import { showAlert } from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import Textbox from "../components/Textbox.jsx";
import Select from "../components/Select.jsx";
import Capes from "../components/Capes.jsx";

import closeIcon from "../assets/buttons/close.svg";

export default function EditProfileMenu({ setMenu, profile, setProfile, reloadData }) {
    const Manager = useManager();

    const [ready, setReady] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [username, setUsername] = useState("");
    const [UID, setUID] = useState("");
    const [skin, setSkin] = useState(undefined);
    const [skinMode, setSkinMode] = useState("file");
    const [cape, setCape] = useState(undefined);
    const [capeHistory, setCapeHistory] = useState([]);
    const [showCapeMenu, setShowCapeMenu] = useState(false);

    useEffect(() => {
        if (profile) {
            setUsername(profile.username);
            setUID(profile.uid);
            if (profile.cape) setCape(profile.cape);
            if (profile.capeHistory) setCapeHistory(profile.capeHistory);
        };
    }, [profile]);

    const handleNewUID = () => {
        const newUid = Manager.utils.generateUID();
        setUID(newUid);
        showToast("Generated new UID");
    };

    const handleExport = async () => {
        setProcessing(true);
        try {
            const res = await Manager.profiles.export(profile.id);
            if(res === true) showToast("Exported successfully");
        } catch(e) {
            showToast("Export failed");
            console.error(e);
        } finally {
            setProcessing(false);
        };
    };

    const handleDelete = async () => {
        const confirmDelete = await showAlert("Delete Profile", `Are you sure you want to delete "${profile.username}" profile?`, "YES_NO");
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

    const fetchDataURI = async (imageUrl) => {
        const skinRes = await fetch(imageUrl);
        if (!skinRes.ok) throw new Error("Failed to download skin image");
        const skinBlob = await skinRes.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(skinBlob);
        });
    };

    const handleCreate = async () => {
        if (!ready) return showToast("You need to enter a valid username");

        setProcessing(true);
        try {
            let skinDataURI = null;
            if (skinMode === "java") {
                showToast("Fetching Java Edition skin...");
                try {
                    const profileRes = await Net.get(`https://api.mojang.com/users/profiles/minecraft/${username}`);
                    if (!profileRes.ok || !profileRes.data?.id) throw new Error("Java user not found");

                    const uuid = profileRes.data.id;

                    const sessionRes = await Net.get(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`);
                    if (!sessionRes.ok || !sessionRes.data?.properties) throw new Error("Profile texture not found");

                    const texturesProp = sessionRes.data.properties.find(p => p.name === 'textures');
                    if (!texturesProp?.value) throw new Error("No texture property found");

                    const decoded = JSON.parse(atob(texturesProp.value));
                    const skinUrl = decoded?.textures?.SKIN?.url;

                    if (skinUrl) skinDataURI = await fetchDataURI(skinUrl);
                } catch (e) {
                    console.error(e);
                    showToast("Failed to fetch Java Edition skin");
                    skinDataURI = undefined;
                };
            } else if (skinMode === "bedrock") {
                showToast("Fetching Bedrock Edition skin...");
                try {
                    const geyserRes = await Net.get(`https://api.geysermc.org/v2/xbox/xuid/${username}`);
                    if (!geyserRes.ok || !geyserRes.data?.xuid) throw new Error("Bedrock user not found");

                    const xuid = geyserRes.data.xuid;
                    const skinRes = await Net.get(`https://api.geysermc.org/v2/skin/${xuid}`);
                    if (!skinRes.ok || !skinRes.data?.is_steve) {
                        const skinUrl = `https://api.geysermc.org/v2/skin/${xuid}/texture`;
                        skinDataURI = await fetchDataURI(skinUrl);
                    };
                } catch (e) {
                    console.error(e);
                    showToast("Failed to fetch Bedrock Edition skin");
                    skinDataURI = undefined;
                };
            } else if (skin) skinDataURI = skin;

            const updatedProfile = await Manager.profiles.update(profile.id, {
                username,
                uid: UID !== "" ? UID : undefined,
                ...(skinDataURI && { skin: skinDataURI }),
                cape: cape !== undefined ? cape : null,
                capeHistory: capeHistory !== undefined ? capeHistory : []
            });

            await reloadData();
            setProfile(updatedProfile);
            setMenu('main');
        } catch (err) {
            console.error(err);
            showToast("Failed to edit profile: " + err.message);
        } finally {
            setProcessing(false);
        };
    };

    const handleBack = () => {
        if (showCapeMenu) setShowCapeMenu(false);
        else setMenu('main');
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
                <h1 id="edit-profile-title">Edit Profile{showCapeMenu ? " - Capes" : ""}</h1>
                <div id="main-actions">
                    <Button id="back-button" onclick={handleBack} tooltip={showCapeMenu ? "Close Capes" : "Close"}>
                        <img id="back-icon" src={closeIcon} draggable={false} />
                    </Button>
                </div>
            </div>
            <div id="edit-profile">
                {processing ? (
                    <h2>Saving profile changes...</h2>
                ) : showCapeMenu ? (
                    <Capes setShowCapeMenu={setShowCapeMenu} cape={cape} setCape={setCape} capeHistory={capeHistory} setCapeHistory={setCapeHistory} profile={profile} />
                ) : (
                    <div className="edit-profile-columns">
                        <div className="column-left">
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
                        </div>
                        <div className="column-right">
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
                                            isFilePicker={true}
                                            onPick={async () => {
                                                const res = await Neutralino.os.showOpenDialog(
                                                    "Select a skin",
                                                    {
                                                        multiSelections: false,
                                                        filters: [
                                                            {name: 'Images', extensions: ['png']},
                                                        ]
                                                    }
                                                );
                                                if (!res || res.length === 0) return;
                                                const src = res[0].trim();
                                                if (!src.endsWith(".png"))
                                                    return showToast("Please select a valid skin file"); // extra check as sometimes a file explorer bypasses filter

                                                if (!(await testPath(src)))
                                                    return showToast("Couldn't find skin from path");

                                                //check if its a skin
                                                const buff = await Neutralino.filesystem.readBinaryFile(src);
                                                if (!(await Manager.skins.isSkin(buff)))
                                                    return showToast("The file you specified wasn't a valid skin file");

                                                setSkin(src);
                                            }}
                                        />
                                    </div>
                                    <Button disabled={processing} pushable={!processing} onclick={() => setShowCapeMenu(true)}>
                                        {cape ? "Cape Selected (Change)" : "Capes"}
                                    </Button>
                                    <h2>Your skin will default to steve if you don't select one.</h2>
                                </>
                            ) : (skinMode === "java" ? (
                                <h2>Will use <b>{username || "Steve"}</b>'s Java Edition skin</h2>
                            ) : (
                                <h2>Will use <b>{username || "Steve"}</b>'s Bedrock Edition skin</h2>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {!showCapeMenu &&
                <div id="edit-profile-action-bar">
                    <div id="profile-action-bar-group">
                        <Button id="delete-button" type="destructive" disabled={processing} pushable={!processing} onclick={handleDelete}>
                            Delete
                        </Button>
                        <Button type="destructive" disabled={processing } pushable={!processing} onclick={handleNewUID}>
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
            }
        </>
    );
};