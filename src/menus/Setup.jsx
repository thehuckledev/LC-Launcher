import "./Setup.css";

import { useState, useEffect } from "preact/hooks";
import Neutralino from "@neutralinojs/lib";
import { useManager } from "../utils/ManagerProvider.jsx";
import { useSettings } from "../utils/SettingsStore.jsx";
import { showToast } from "../components/Toast.jsx";

import Button from "../components/Button.jsx";
import Textbox from "../components/Textbox.jsx";
import Checkbox from "../components/Checkbox.jsx";

import minecraftLogo from "../assets/ui/minecraftlogo.png";

import { defaultInstances } from "../data/defaultInstances.js";

export default function SetupMenu({ setMenu, reloadData }) {
    const Manager = useManager();
    const { settings, updateSetting } = useSettings();

    const [canInstallWine, setCanInstallWine] = useState(false);
    const [installWine, setInstallWine] = useState(true);
    const [ready, setReady] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [username, setUsername] = useState("");
    const [skin, setSkin] = useState(undefined);

    useEffect(() => {
        async function checkWine() {
            try {
                if (NL_OS !== "Linux" &&
                    NL_OS !== "Darwin" &&
                    NL_ARCH !== "x64" &&
                    NL_ARCH !== "arm"
                ) return setCanInstallWine(false);

                const res = await Neutralino.os.execCommand("wine --version");

                if (res.exitCode === 0) setCanInstallWine(false);
                else setCanInstallWine(true);
            } catch (err) {
                console.error(err);
                setCanInstallWine(false);
                setInstallWine(false);
            };
        };

        checkWine();
    }, []);

    async function installWineHelper() {
        try {
            const wineDir = `${settings.dataDirectory}/libraries/wine-crossover`;
            const dxvkDir = `${settings.dataDirectory}/libraries/dxvk`;
            const wineTempDir = `${settings.dataDirectory}/libraries/_wine`;
            let downloadUrl = "";
            let expectedHash = "";
            let archiveName = "";

            const dxvkArchive = `dxvk-macOS-async-v1.10.3-20230507-repack.tar.gz`;
            const dxvkUrl = `https://github.com/Gcenx/DXVK-macOS/releases/download/v1.10.3-20230507-repack/${dxvkArchive}`;
            const dxvkHash = "acd1520ad105d8ef124a09c8e11a259a5dc8bdc565ad18e0e52693f9807b2477";
            const dxvkPath = `${settings.dataDirectory}/libraries/${dxvkArchive}`;
            
            if (NL_OS === "Linux") {
                if (NL_ARCH === "x64") {
                    archiveName = "wine-11.5-staging-x86.tar.xz";
                    downloadUrl = `https://github.com/Kron4ek/Wine-Builds/releases/download/11.5/${archiveName}`;
                    expectedHash = "c72cfadce331b8af3cb0c2a767a7b75d5b96eabf2d26baf0797d57f0b6625c6f";
                } else if (NL_ARCH === "arm") {
                    archiveName = "wine-11.5-staging-amd64-wow64.tar.xz";
                    downloadUrl = `https://github.com/Kron4ek/Wine-Builds/releases/download/11.5/${archiveName}`;
                    expectedHash = "33a3bd827e2252a169e87487255441f9ad2e84f1e8382a67b5734066ea908f96";
                };
            } else if (NL_OS === "Darwin") {
                archiveName = "wine-crossover-23.7.1-1-osx64.tar.xz"; 
                downloadUrl = `https://github.com/Gcenx/winecx/releases/download/crossover-wine-23.7.1-1/${archiveName}`;
                expectedHash = "e24ba084737c8823e8439f7cb75d436a917fd92fc34b832bcaa0c0037eb33d03"; 
            };

            try {
                await Neutralino.filesystem.createDirectory(wineDir);
            } catch {};
            try {
                await Neutralino.filesystem.createDirectory(wineTempDir);
            } catch {};

            const archivePath = `${settings.dataDirectory}/libraries/${archiveName}`;

            showToast(`Installing Wine...`, 3000);

            await Neutralino.os.execCommand(`curl -L -o "${archivePath}" "${downloadUrl}"`);

            const hasher = (NL_OS === "Linux") ? "sha256sum" : "shasum -a 256";
            let check = await Neutralino.os.execCommand(`${hasher} "${archivePath}" | cut -d ' ' -f 1`);
            if (check.stdOut.trim() !== expectedHash) throw new Error("WINE Checksum failed, try manual install");

            await Neutralino.os.execCommand(`tar -xf "${archivePath}" -C "${wineTempDir}" --strip-components=1`);

            if (NL_OS === "Darwin") {
                const internalWineSource = `${wineTempDir}/Contents/Resources/wine`;
                await Neutralino.os.execCommand(`cp -R "${internalWineSource}/." "${wineDir}"`);
                await Neutralino.os.execCommand(`xattr -rd com.apple.quarantine "${wineDir}"`);
            } else {
                await Neutralino.os.execCommand(`cp -R "${wineTempDir}/." "${wineDir}"`);
            };

            await Neutralino.filesystem.remove(wineTempDir);
            await Neutralino.filesystem.remove(archivePath);

            async function setupDXVK() {
                const dxvkLibDir = `${settings.dataDirectory}/libraries/dxvk`;
                const winePrefix = `${settings.dataDirectory}/pfx`;
        
                const system32 = `${winePrefix}/drive_c/windows/system32`;
                const syswow64 = `${winePrefix}/drive_c/windows/syswow64`;
        
                try {
                    await Neutralino.os.execCommand(`cp -f "${dxvkLibDir}/x64/"*.dll "${system32}"`);
                    await Neutralino.os.execCommand(`cp -f "${dxvkLibDir}/x32/"*.dll "${syswow64}"`);
        
                    showToast("DXVK Applied to Wine", 2000);
                } catch (err) {
                    console.error("DXVK setup failed:", err);
                    showToast("Failed to apply DXVK");
                };
            };

            async function setupCDrive() {
                const internalWinePath = `${settings.dataDirectory}/libraries/wine-crossover/bin/wine`;
                const bin = `"${internalWinePath}"`;
                const prefix = `${settings.dataDirectory}/pfx`;
                try {
                    await Neutralino.filesystem.getStats(prefix);
                } catch {
                    showToast('Setting up C Drive...');
                    try { await Neutralino.filesystem.createDirectory(prefix); } catch {};

                    await Neutralino.os.execCommand(`WINEPREFIX="${prefix}" WINEDEBUG=-all ${bin} wineboot --init`);
                    if(NL_OS === 'Darwin') await setupDXVK();
                };
            };

            if (NL_OS === "Darwin") {
                showToast("Wine installed. Installing DXVK...", 3000);

                // DXVK
                await Neutralino.os.execCommand(`curl -L -o "${dxvkPath}" "${dxvkUrl}"`);

                let dxvkCheck = await Neutralino.os.execCommand(`shasum -a 256 "${dxvkPath}" | cut -d ' ' -f 1`);
                if (dxvkCheck.stdOut.trim() !== dxvkHash) throw new Error("DXVK Checksum failed, try manual install");

                try {
                    await Neutralino.filesystem.createDirectory(dxvkDir);
                } catch {};
                await Neutralino.os.execCommand(`tar -xf "${dxvkPath}" -C "${dxvkDir}" --strip-components=1`);

                await Neutralino.filesystem.remove(dxvkPath).catch(() => {});
                await setupCDrive();
                showToast("Wine & DXVK installed successfully", 2000);
            } else {
                await setupCDrive();
                showToast("Wine installed successfully", 2000);
            };
        } catch (err) {
            console.error("Wine download failed:", err);
            showToast("Wine install failed, try manual install");
        };
    };

    const makeDefaultInstances = async () => { //DONE TODO make it use the name, also add support for non github projects
        for await (const inst of defaultInstances) { //DONE TODO make instance icons
            if (!inst.supportedPlatforms.includes(NL_OS)) continue;
            await Manager.instances.create(
                inst.icon,
                inst.name,
                inst.serviceType,
                inst.serviceDomain,
                inst.repo,
                inst.tag,
                inst.exec,
                inst.target,
                inst.compatibilityLayer,
                inst.customArgs
            );
        };
    };

    const handleNext = async () => {
        if (!ready) return showToast("You need to enter a valid username");

        setProcessing(true);
        try {
            if (skin) {
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
            } else {
                await Manager.profiles.create(username);
            };

            // make insts
            await makeDefaultInstances();

            // install wine
            if (canInstallWine === true && installWine === true) await installWineHelper();

            await updateSetting('hasSetup', true);
            await reloadData();

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

    // TODO add keep launcher open when game running option
    // TODO add discord rpc option
    // TODO add data dir option
    // TODO add music option
    // TODO make an options setup menu and also add the above to the normal options menu also

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
                    <h2>Setting up your launcher... Please wait up to 3 mins!</h2>
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
                        <br />
                        {canInstallWine &&
                            <Checkbox
                                id="install-wine-checkbox"
                                value={installWine}
                                onchange={(state) => {
                                    setInstallWine(state);
                                }}
                                label="Install wine for me (Recommended)"
                            />
                        }
                        <br />
                        <h2>A community made fork will be automatically added as an instance.</h2>
                        <h2>If you don't want it, you can simply remove it.</h2>
                    </>
                )}
            </div>
            <div id="action-bar">
                <Button id="skip-button" disabled={processing} onclick={async() => {
                    await updateSetting('hasSetup', true);
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