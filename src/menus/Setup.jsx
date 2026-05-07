import "./Setup.css";

import { useState, useEffect } from "preact/hooks";
import Neutralino from "@neutralinojs/lib";
import { useManager } from "../utils/ManagerProvider.jsx";
import { useSettings } from "../utils/SettingsStore.jsx";
import { showToast } from "../components/Toast.jsx";

import config from "../data/config.js";

import Button from "../components/Button.jsx";
import Textbox from "../components/Textbox.jsx";
import Checkbox from "../components/Checkbox.jsx";

import minecraftLogo from "../assets/ui/minecraftlogo.png";

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
    const [progress, setProgress] = useState({ active: false, label: '', percent: 0 });

    useEffect(() => {
        const handleProgress = (e) => setProgress(e.detail);
        window.addEventListener('installProgress', handleProgress);
        return () => window.removeEventListener('installProgress', handleProgress);
    }, []);

    useEffect(() => {
        async function checkWine() {
            try {
                if (NL_OS !== "Linux" &&
                    NL_OS !== "Darwin"
                ) return setCanInstallRuntime(false);
                else setCanInstallRuntime(true);

                /*const res = await Neutralino.os.execCommand("command -v wine");

                if (res.exitCode === 0) setCanInstallRuntime(false);
                else setCanInstallRuntime(true);*/
            } catch (err) {
                console.error(err);
                setCanInstallRuntime(false);
                setInstallRuntime(false);
            };
        };

        checkWine();
    }, []);

    const makeDefaultInstances = async () => {
        for await (const inst of defaultInstances) {
            if (!inst.supportedPlatforms.includes(NL_OS)) continue;
            await Manager.instances.create(inst.id, inst);
        };
    };

    const joinDiscordPrompt = async () => {
        try {
            let shouldDo = await Neutralino.os
                        .showMessageBox('LC Launcher Discord',
                                        'Do you want to join our Discord server?',
                                        'YES_NO', 'INFO');
            if(shouldDo == 'YES') {
                console.log("Opening discord...");
                for await (const inv of config.discordInvite) {
                    await Neutralino.os.open(inv);
                };
            };
        } catch(e) {
            console.error("Error joining discord: ")
        };
    };

    const handleNext = async () => {
        if (!ready) return showToast("You need to enter a valid username");

        joinDiscordPrompt();
        setProcessing(true);
        try {
            if (skin) await Manager.profiles.create(username, skin, UID !== "" ? UID : undefined);
            else await Manager.profiles.create(username, undefined, UID !== "" ? UID : undefined);

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
            <div id="setup">
                <h1 class="moto">Welcome to
                    <div class="slidingVertical">
                        <span>LC Launcher</span>
                        <span>Legacy Community Launcher</span>
                        <span>LCE Launcher</span>
                    </div>
                </h1>
                {processing ? (
                    <div id="setup-processing">
                        <h2>Setting up your launcher...</h2>
                        {progress.active ? (
                            <div id="progress-container">
                                <h2 id="progress-status">{progress.label} {progress.eta && `(${progress.eta})`}</h2>
                                <div id="progress-bar">
                                    <div
                                        id="progress-fill"
                                        style={{ width: `${progress.percent}%` }}
                                    />
                                </div>
                            </div>
                        ) : ""}
                    </div>
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
                    </>
                )}
            </div>
            <div id="setup-action-bar">
                <Button id="skip-button" disabled={processing} pushable={!processing} onclick={async() => {
                    await makeDefaultInstances(); // still want instances
                    await updateSetting('hasSetup', true);
                    setMenu('main');
                }}>
                    Skip Setup
                </Button>
                <Button id="done-button" disabled={!ready || processing} pushable={ready && !processing} onclick={handleNext}>
                    Done
                </Button>
            </div>
        </>
    );
};