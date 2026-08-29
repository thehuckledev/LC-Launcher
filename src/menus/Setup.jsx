import "./Setup.css";

import { useState, useEffect } from "preact/hooks";
import Neutralino from "@neutralinojs/lib";
import { useManager } from "../utils/ManagerProvider.jsx";
import { useSettings } from "../utils/SettingsStore.jsx";
import Net from "../lib/net.js";

import config from "../data/config.js";

import { showToast } from "../components/Toast.jsx";
import Button from "../components/Button.jsx";
import Textbox from "../components/Textbox.jsx";
import Checkbox from "../components/Checkbox.jsx";
import Select from "../components/Select.jsx";
import Capes from "../components/Capes.jsx";

import minecraftLogo from "../assets/ui/minecraftlogo.png";
import closeIcon from "../assets/buttons/close.svg";

import { defaultInstances } from "../data/defaultInstances.js";
import Download from "../utils/download.js";
import Unzip from "../utils/unzip.js";

export default function SetupMenu({ setMenu, reloadData }) {
    const Manager = useManager();
    const { settings, updateSetting } = useSettings();

    const [canInstallRuntime, setCanInstallRuntime] = useState(false);
    const [installRuntime, setInstallRuntime] = useState(true);
    const [ready, setReady] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [username, setUsername] = useState("");
    const [UID, setUID] = useState("");
    const [skin, setSkin] = useState(undefined);
    const [skinMode, setSkinMode] = useState("file");
    const [cape, setCape] = useState(undefined);
    const [showCapeMenu, setShowCapeMenu] = useState(false);
    const [progress, setProgress] = useState({ active: false, label: '', percent: 0 });
    const [openAnim, setOpenAnim] = useState(true);

    useEffect(() => {
        const handleProgress = (e) => setProgress(e.detail);
        window.addEventListener('installProgress', handleProgress);
        return () => window.removeEventListener('installProgress', handleProgress);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setOpenAnim(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        async function checkRuntime() {
            try {
                if (NL_OS !== "Linux" &&
                    NL_OS !== "Darwin"
                ) return setCanInstallRuntime(false);

                if (NL_OS === "Linux") {
                    const protonPath = await Manager.exec.findProtonPath();
                    if (protonPath) return setCanInstallRuntime(false);
                };

                setCanInstallRuntime(true);

                /*const res = await Neutralino.os.execCommand("command -v wine");

                if (res.exitCode === 0) setCanInstallRuntime(false);
                else setCanInstallRuntime(true);*/
            } catch (err) {
                console.error(err);
                setCanInstallRuntime(false);
                setInstallRuntime(false);
            };
        };

        checkRuntime();
    }, []);

    const makeDefaultInstances = async () => {
        for await (const inst of defaultInstances) {
            if (!inst.supportedPlatforms.includes(NL_OS)) continue;
            await Manager.instances.create(inst.id, inst);
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

    const handleNext = async () => {
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

            console.log("cape",cape)
            const newProfile = await Manager.profiles.create({
                username,
                skin: skinDataURI || undefined,
                uid: UID !== "" ? UID : undefined,
                cape: cape !== undefined ? cape : null
            });

            // make insts
            await makeDefaultInstances();

            // install runtime
            if (canInstallRuntime === true && installRuntime === true) await Manager.exec.installRuntimeHelper();

            await updateSetting('hasSetup', true);
            await reloadData();

            showToast("Setup saved and completed");
            setMenu('setupoptions');
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
            <div id="setup" className={openAnim ? "animated" : ""}>
                <div id="setup-top-bar">
                    <h1 class="moto">Welcome to
                        <div class="slidingVertical">
                            <span>LC Launcher</span>
                            <span>Legacy Community Launcher</span>
                            <span>LCE Launcher</span>
                        </div>
                    </h1>
                    {showCapeMenu &&
                        <div id="main-actions">
                            <Button id="back-button" onclick={() => setShowCapeMenu(false)} tooltip="Close Capes">
                                <img id="back-icon" src={closeIcon} draggable={false} />
                            </Button>
                        </div>
                    }
                </div>
                {processing ? (
                    <div id="setup-processing">
                        <h2>Setting up your launcher...</h2>
                        {progress.active ? (
                            <div id="setup-progress-container">
                                <h2 id="progress-status">{progress.label} {progress.eta && `(${progress.eta})`}</h2>
                                <div id="progress-bar">
                                    <div
                                        id="progress-fill"
                                        className={progress.status === "starting" ? "indeterminate" : ""}
                                        style={{ width: `${progress.percent}%` }}
                                    />
                                </div>
                            </div>
                        ) : ""}
                    </div>
                ) : showCapeMenu ? (
                    <Capes setShowCapeMenu={setShowCapeMenu} cape={cape} setCape={setCape} />
                ) : (
                    <div className="setup-columns">
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
                            <br />
                            {canInstallRuntime === true &&
                                <Checkbox
                                    id="install-runtime-checkbox"
                                    value={installRuntime}
                                    onchange={(state) => {
                                        setInstallRuntime(state);
                                    }}
                                    label="Install wine / proton for me (Recommended)"
                                />
                            }
                            <br />
                            <h2>A set of community made forks will be automatically added as an instances.</h2>
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
                <div id="setup-action-bar" className={openAnim ? "animated" : ""}>
                    <Button id="skip-button" disabled={processing || showCapeMenu} pushable={!processing && !showCapeMenu} onclick={async() => {
                        await makeDefaultInstances(); // still want instances
                        await updateSetting('hasSetup', true);
                        setMenu('main');
                    }}>
                        Skip Setup
                    </Button>
                    <Button id="done-button" disabled={!ready || processing || showCapeMenu} pushable={ready && !processing && !showCapeMenu} onclick={handleNext}>
                        Done
                    </Button>
                </div>
            }
        </>
    );
};