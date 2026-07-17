import "./App.css";

import { useState, useEffect, useRef } from "preact/hooks";
import Neutralino from "@neutralinojs/lib";
import config from "./data/config.js";
import { defaultInstances } from "./data/defaultInstances.js";

import { checkForUpdates } from "./utils/updater.js";
import { startMusic, stopMusic, setVolume } from "./utils/music.js";
import { useSettings } from "./utils/SettingsStore.jsx";
import { useManager } from "./utils/ManagerProvider.jsx";
import DiscordRPC from "./lib/discordRPC.js";
import Net from "./lib/net.js";

import Window from "./components/Window.jsx";
import Toast, { showToast } from "./components/Toast.jsx";

import SetupMenu from "./menus/Setup.jsx";
import SetupOptionsMenu from "./menus/SetupOptions.jsx";
import MainMenu from "./menus/Main.jsx";
import OptionsMenu from "./menus/Options.jsx";
import AboutMenu from "./menus/About.jsx";
import PatchNotesMenu from "./menus/PatchNotes.jsx";
import GameLogMenu from "./menus/GameLog.jsx";
import CrashMenu from "./menus/Crash.jsx";
import CreateProfileMenu from "./menus/CreateProfile.jsx";
import CreateInstanceMenu from "./menus/CreateInstance.jsx";
import EditProfileMenu from "./menus/EditProfile.jsx";
import EditInstanceMenu from "./menus/EditInstance.jsx";
import ScreenshotMenu from "./menus/Screenshots.jsx";
import ServersMenu from "./menus/Servers.jsx";
import AddServerMenu from "./menus/AddServer.jsx";
import EditServerMenu from "./menus/EditServer.jsx";

export default function App() {
    const [processing, setProcessing] = useState(false);
    const [runningProc, setRunningProc] = useState(null);
    const [crashed, setCrashed] = useState(false);
    const [profile, setProfile] = useState(null);
    const [instance, setInstance] = useState(null);
    const [server, setServer] = useState(null);
    const [profilesList, setProfilesList] = useState([]);
    const [instancesList, setInstancesList] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [menu, setMenu] = useState("main");
    const [logs, setLogs] = useState([]);
    const [dropHighlight, setDropHighlight] = useState(false);
    const dragCounter = useRef(0);
    const lastSkinCDNLink = useRef(""); 
    const lastProfileID = useRef("");
    const { settings, loadSettings, updateSetting } = useSettings();
    const Manager = useManager();

    async function loadData(loadedSettings = settings) {
        const profiles = await Manager.profiles.list();
        console.log("Loading profile list", profiles);
        const instances = await Manager.instances.list();
        console.log("Loading instance list", instances);
        const instancesData = (await Promise.all(
            instances.map(id => Manager.instances.get(id))
        )).filter(i => i !== undefined);
        console.log("Getting full instance list", instancesData);
        
        setProfilesList(profiles);
        console.log("setProfilesList()", profiles);
        setInstancesList(instancesData);
        console.log("setInstancesList()", instancesData);

        if (profiles.length > 0) {
            const lastProfile = profiles.find(p => p.id === loadedSettings.lastProfileID);
            if (lastProfile) setProfile(lastProfile);
            else setProfile(profiles[0]);
        } else setProfile(null);
        console.log("setProfile()");

        if (instances.length > 0) {
            const defaultInst = instancesData.find(i => i.id === config.defaultInstance);
            const lastInst = instancesData.find(i => i.id === loadedSettings.lastInstanceID);

            if (lastInst) setInstance(lastInst);
            else if (defaultInst) setInstance(defaultInst);
            else setInstance(instancesData[0]);
        } else setInstance(null);
        console.log("setInstance()");
    };

    async function syncDefaultInstances() {
        const installedInstances = await Manager.instances.list();
        console.log("Loading instance list", installedInstances);
        const installedObjects = (await Promise.all(
            installedInstances.map(id => Manager.instances.get(id))
        )).filter(i => i !== undefined);
        console.log("Fetched installed instances", installedInstances);

        for await (const inst of defaultInstances) {
            if (!inst.supportedPlatforms.includes(NL_OS)) continue;

            console.log("Syncing instance " + inst?.name);

            const existing = installedObjects.find(i => i.id === inst.id);
            if (!existing) continue;

            const { id, compatibilityLayer, ...updateData } = inst;
            const hasChanges = Object.keys(updateData).some(
                key => JSON.stringify(existing[key]) !== JSON.stringify(updateData[key])
            );

            console.log(`Instance has changes: ${hasChanges} (${inst?.name})`);

            if (hasChanges) {
                await Manager.instances.update(existing.id, updateData);
                await new Promise(resolve => setTimeout(resolve, 50)); 
            };
        };
    };

    useEffect(() => {
        async function load() {
            console.log("Running load func");
            const loadedSettings = await loadSettings();
            console.log("Loaded settings", loadedSettings);
            await Manager.init().catch(e=>console.log(e));
            console.log("Initialised manager");
            await syncDefaultInstances().catch(e=>console.log(e));
            console.log("Synced default instances");
            await loadData(loadedSettings).catch(e=>console.log(e));
            console.log("Loaded data");

            setMenu(loadedSettings.hasSetup ? "main" : "setup");
            console.log("Load menu set to", loadedSettings.hasSetup ? "main" : "setup");
            setLoaded(true);
            console.log("Loaded!");

            setTimeout(checkForUpdates, 2000);
            console.log("Update check triggered");
        };

        load();
    }, []);

    useEffect(() => {
        if (profile?.uid && settings.lastProfileID !== profile.id)
            updateSetting('lastProfileID', profile.id);
    }, [profile]);

    useEffect(() => {
        if (instance?.id && settings.lastInstanceID !== instance.id)
            updateSetting('lastInstanceID', instance.id);
    }, [instance]);

    const openAnimPlaying = useRef(true);
    useEffect(() => {
        const timer = setTimeout(() => {
            openAnimPlaying.current = false;
        }, 1600);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        async function toggleRPC() {
            if (settings.discordRPC === true) {
                console.log("Activating Discord RPC...");
                await DiscordRPC.enable(config.rpcClientID); 
            } else {
                await DiscordRPC.disable();
            }
        }
        toggleRPC();
    }, [settings.discordRPC]);

    useEffect(() => {
        async function updateRPC() {
            let details = "";
            let state = profile?.username 
                        ? `${profile.username} • ${profile.type.charAt(0) + profile.type.substring(1).toLowerCase()}`
                        : "No profile";
            //let largeImageText = profile?.uid ? `${NL_APPVERSION ? `v${NL_APPVERSION}` : ''} • Profile UID: ${profile.uid.substring(2)}` : `${NL_APPVERSION ? `v${NL_APPVERSION}` : ''}`;
            // this above is bad cause people can then join as other people
            let largeImageText = NL_APPVERSION ? `v${NL_APPVERSION}` : '';
            switch (true) {
                case menu === "crash":
                    details = "Viewing Crash Logs";
                    break;
                case processing:
                    details = `Playing on ${instance?.name || "Unknown"}`;
                    break;
                case menu === "main":
                    details = "In Main Menu";
                    break;
                case menu === "options":
                    details = "Editing Options";
                    break;
                case menu === "setup":
                case menu === "setupoptions":
                    details = "Setting up launcher";
                    break;
                case menu === "patchnotes":
                    details = "Viewing Patch Notes";
                    break;
                case menu === "gamelog":
                    details = "Viewing Game Logs";
                    break;
                case menu === "createprofile":
                    details = "Creating a new profile";
                    break;
                case menu === "createinstance":
                    details = "Creating a new instance";
                    break;
                case menu === "editprofile":
                    details = "Editing Profile";
                    break;
                case menu === "editinstance":
                    details = "Editing Instance";
                    break;
                case menu === "screenshots":
                    details = "Viewing Screenshots";
                    break;
                case menu === "servers":
                    details = "Viewing Server List";
                    break;
                case menu === "about":
                    details = "In About Menu";
                    break;
                case menu === "addserver":
                    details = "Adding a Server";
                    break;
                case menu === "editserver":
                    details = "Editing a Server";
                    break;
            };

            let skinCDNLink = undefined;
            if (profile) {
                if (profile.id === lastProfileID.current && lastSkinCDNLink.current) {
                    skinCDNLink = lastSkinCDNLink.current;
                } else if (!profile.skinRender) { // this is steve
                    skinCDNLink = "steve_skin";
                    lastSkinCDNLink.current = "steve_skin";
                    lastProfileID.current = profile.id;
                } else {
                    try {
                        const img = new Image();
                        img.src = profile.skinRender;
                        
                        await new Promise((resolve) => {
                            img.onload = resolve;
                        });

                        const upscaleCanvas = document.createElement('canvas');
                        const upscaleContext = upscaleCanvas.getContext('2d');
                        
                        const targetSize = 128; 
                        upscaleCanvas.width = targetSize;
                        upscaleCanvas.height = targetSize;

                        upscaleContext.imageSmoothingEnabled = false;
                        upscaleContext.webkitImageSmoothingEnabled = false;
                        upscaleContext.mozImageSmoothingEnabled = false;
                        upscaleContext.msImageSmoothingEnabled = false;

                        upscaleContext.drawImage(img, 0, 0, targetSize, targetSize);
                        
                        const blob = await new Promise((resolve) => {
                            upscaleCanvas.toBlob(resolve, 'image/png');
                        });
                        if (!blob) throw new Error("Failed to convert canvas to blob");

                        const formData = new FormData();
                        formData.append('file', blob, 'skinRender.png');
                        formData.append('expire', 21600); // 6h
                        const response = await fetch('https://tmpfiles.org/api/v1/upload', {
                            method: 'POST',
                            body: formData
                        });

                        if (response.ok) {
                            const json = await response.json();
                            if (json.status === 'success' && json.data?.url) {
                                const response2 = await Net.get(json?.data?.url);
                                if (response2.ok) {
                                    const responseHTML = response2?.data;
                                    const newSkinCDNLink = responseHTML?.split(`<img id="img_preview" src="`)?.[1]?.split(`"/>
            
            <p><a class="download" `)?.[0];
                                
                                    skinCDNLink = newSkinCDNLink;
                                    lastSkinCDNLink.current = newSkinCDNLink;
                                    lastProfileID.current = profile.id;
                                } else {
                                    throw new Error("Skin view URL didn't return ok response");
                                };
                            } else {
                                throw new Error("Skin upload wasn't successful");
                            };
                        } else {
                            throw new Error("Skin didn't return ok response");
                        };
                    } catch (e) {
                        console.error(e);
                        
                        skinCDNLink = "steve_skin";
                        lastSkinCDNLink.current = "steve_skin";
                        lastProfileID.current = profile.id;
                    };
                };
            };

            const RPCObj = {
                details,
                state,
                largeImageText,
                largeImageKey: config.rpcIcon,
                smallImageKey: skinCDNLink,
                smallImageText: profile?.username,
                buttons: [
                    {
                        label: config.button1Label,
                        url: config.button1Url
                    },
                    {
                        label: config.button2Label,
                        url: config.button2Url
                    }
                ]
            };

            console.log("Updating RPC:", RPCObj);
            DiscordRPC.edit(RPCObj);
        };
        updateRPC();
    }, [menu, instance, profile, processing, settings.discordRPC]);

    useEffect(() => {
        if (openAnimPlaying.current == true) {
            const timer = setTimeout(() => {
                if (settings.menuMusic == true) startMusic();
                else stopMusic();
            }, 1600);

            return () => clearTimeout(timer);
        };

        if (settings.menuMusic == true) startMusic();
        else stopMusic();
    }, [settings.menuMusic]);

    useEffect(() => {
        const value = parseInt(settings.volume);
        if (!Number.isInteger(value)) return;
        setVolume(value / 100);
    }, [settings.volume]);

    useEffect(() => {
        const handler = (e) => {
            setLogs(prev => [
                ...prev.slice(-1000),
                e.detail
            ]);
        };

        window.addEventListener("gameLog", handler);
        return () => window.removeEventListener("gameLog", handler);
    }, []);

    useEffect(() => {
        const handler = (e) => {
            const shouldSilence = e.detail;
            if (shouldSilence === true) stopMusic();
            else if (settings.menuMusic === true) startMusic();
        };

        window.addEventListener("silenceMusic", handler);
        return () => window.removeEventListener("silenceMusic", handler);
    }, [settings.menuMusic]);

    useEffect(() => {
        const handleRunning = (e) => {
            setRunningProc(e.detail);
        };

        const handleProcessing = (e) => {
            if(e.detail === false) setRunningProc(null);
            if(e.detail === false && crashed === false) {
                setMenu("main");
                setLogs([]);
            };
            setProcessing(e.detail);
        };

        window.addEventListener('procRunning', handleRunning);
        window.addEventListener('execProcessing', handleProcessing);

        return () => {
            window.removeEventListener('procRunning', handleRunning);
            window.removeEventListener('execProcessing', handleProcessing);
        };
    }, [crashed]);

    useEffect(() => {
        const handler = () => {
            setCrashed(true);
            setMenu("crash");
        };

        window.addEventListener("gameCrash", handler);
        return () => window.removeEventListener("gameCrash", handler);
    }, []);

    useEffect(() => {
        const handleDrop = async (e) => {
            e.preventDefault();
            dragCounter.current = 0;
            setDropHighlight(false);

            const file = e.dataTransfer.files[0];
            const isInstance = file.name.endsWith(".lceinstance.json");
            const isProfile = file.name.endsWith(".lceprofile.json");
            const isServer = file.name.endsWith(".lceserver.json");

            if (!isInstance && !isProfile && !isServer) return showToast("Invalid, must be a .lceinstance.json, .lceprofile.json or .lceserver.json file.");

            try {
                const text = await file.text();

                if (isInstance) {
                    const newInst = await Manager.instances.import(text);

                    await loadData();
                    setInstance(newInst);
                } else if (isProfile) {
                    const newProfile = await Manager.profiles.import(text);
                    await loadData();

                    setProfile(newProfile);
                } else if (isServer) {
                    await Manager.servers.import(instance?.id, text);
                };
            } catch (err) {
                console.error(err);
            };
        };

        const highlight = (e) => {
            e.preventDefault();
            dragCounter.current++;
            setDropHighlight(true);
        };

        const unhighlight = (e) => {
            e.preventDefault();
            dragCounter.current--;
            if (dragCounter.current === 0) setDropHighlight(false);
        };

        const preventDefault = (e) => e.preventDefault();

        window.addEventListener("dragover", preventDefault);
        window.addEventListener("dragenter", highlight);
        window.addEventListener("dragleave", unhighlight);
        window.addEventListener("drop", handleDrop);
        
        return () => {
            window.removeEventListener("dragover", preventDefault);
            window.removeEventListener("dragenter", highlight);
            window.removeEventListener("dragleave", unhighlight);
            window.removeEventListener("drop", handleDrop);
        };
    }, [Manager, instance]);

    return (
        <>
            <Window title="" menu={menu} setMenu={setMenu} isPanorama={Array.isArray(instance?.background)} backgroundSrc={instance?.background}>
                {dropHighlight && (
                    <div id="instance-drop-area">
                        <div className="instance-drop-inner">
                            <h2>Drop Instance File Here</h2>
                            <p>.lceinstance.json / .lceprofile.json / .lceserver.json</p>
                        </div>
                    </div>
                )}
                
                {loaded && <>
                    {menu === "setup" &&          <SetupMenu setMenu={setMenu} reloadData={loadData} />}
                    {menu === "setupoptions" &&   <SetupOptionsMenu setMenu={setMenu} />}
                    {menu === "main" &&           <MainMenu setMenu={setMenu} instance={instance} setInstance={setInstance} profile={profile} setProfile={setProfile} instancesList={instancesList} profilesList={profilesList} processing={processing} reloadData={loadData} runningProc={runningProc} />}
                    {menu === "options" &&        <OptionsMenu setMenu={setMenu} />}
                    {menu === "about" &&          <AboutMenu setMenu={setMenu} />}
                    {menu === "patchnotes" &&     <PatchNotesMenu setMenu={setMenu} instance={instance} />}
                    {menu === "gamelog" &&        <GameLogMenu setMenu={setMenu} logs={logs} />}
                    {menu === "crash" &&          <CrashMenu setMenu={setMenu} setCrashed={setCrashed} setLogs={setLogs} logs={logs} />}
                    {menu === "createprofile" &&  <CreateProfileMenu setMenu={setMenu} setProfile={setProfile} reloadData={loadData} />}
                    {menu === "createinstance" && <CreateInstanceMenu setMenu={setMenu} setInstance={setInstance} reloadData={loadData} />}
                    {menu === "editprofile" &&    <EditProfileMenu setMenu={setMenu} profile={profile} setProfile={setProfile} reloadData={loadData} />}
                    {menu === "editinstance" &&   <EditInstanceMenu setMenu={setMenu} instance={instance} setInstance={setInstance} reloadData={loadData} />}
                    {menu === "screenshots" &&    <ScreenshotMenu setMenu={setMenu} />}
                    {menu === "servers" &&        <ServersMenu setMenu={setMenu} instance={instance} profile={profile} setServer={setServer} />}
                    {menu === "addserver" &&      <AddServerMenu setMenu={setMenu} instance={instance} />}
                    {menu === "editserver" &&     <EditServerMenu setMenu={setMenu} instance={instance} server={server} />}
                </>}
            </Window>

            <Toast />
        </>
    );
};