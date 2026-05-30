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

export default function App() {
    const [processing, setProcessing] = useState(false);
    const [runningProc, setRunningProc] = useState(null);
    const [crashed, setCrashed] = useState(false);
    const [profile, setProfile] = useState(null);
    const [instance, setInstance] = useState(null);
    const [profilesList, setProfilesList] = useState([]);
    const [instancesList, setInstancesList] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [menu, setMenu] = useState("main");
    const [logs, setLogs] = useState([]);
    const [dropHighlight, setDropHighlight] = useState(false);
    const dragCounter = useRef(0);
    const { settings, loadSettings, updateSetting } = useSettings();
    const Manager = useManager();

    async function loadData(loadedSettings = settings) {
        const profiles = await Manager.profiles.list();
        const instances = await Manager.instances.list();
        const instancesData = await Promise.all(instances.map(id => Manager.instances.get(id)));
        
        setProfilesList(profiles);
        setInstancesList(instancesData);

        if (profiles.length > 0) {
            const lastProfile = profiles.find(p => p.id === loadedSettings.lastProfileID);
            if (lastProfile) setProfile(lastProfile);
            else setProfile(profiles[0]);
        } else setProfile(null);

        if (instances.length > 0) {
            const instancesObj = await Promise.all(instances.map(id => Manager.instances.get(id)));
            const defaultInst = instancesObj.find(i => i.id === config.defaultInstance);
            const lastInst = instancesObj.find(i => i.id === loadedSettings.lastInstanceID);

            if (lastInst) setInstance(lastInst);
            else if (defaultInst) setInstance(defaultInst);
            else setInstance(instancesObj[0]);
        } else setInstance(null);
    };

    async function syncDefaultInstances() {
        const installedInstances = await Manager.instances.list();
        const installedObjects = await Promise.all(installedInstances.map(id => Manager.instances.get(id)));

        for await (const inst of defaultInstances) {
            if (!inst.supportedPlatforms.includes(NL_OS)) continue;

            const existing = installedObjects.find(i => i.id === inst.id);
            if (!existing) continue;

            const { id, compatibilityLayer, ...updateData } = inst; 
            await Manager.instances.update(existing.id, updateData);
        };
    };

    useEffect(() => {
        async function load() {
            const loadedSettings = await loadSettings();

            await DiscordRPC.init(config.rpcClientID);

            await Manager.init();
            await syncDefaultInstances();
            await loadData(loadedSettings);

            setMenu(loadedSettings.hasSetup ? "main" : "setup");
            setLoaded(true);
            console.log("Loaded!");

            setTimeout(checkForUpdates, 2000);
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
        if (settings.discordRPC === true) DiscordRPC.enable();
        else DiscordRPC.disable();
    }, [settings.discordRPC]);

    useEffect(() => {
        let details = "";
        let state = profile?.username 
                    ? `${profile.username} • ${profile.type.charAt(0) + profile.type.substring(1).toLowerCase()}`
                    : "No profile";
        let largeImageText = profile?.uid ? `${NL_APPVERSION ? `v${NL_APPVERSION}` : ''} • Profile UID: ${profile.uid.substring(2)}` : `${NL_APPVERSION ? `v${NL_APPVERSION}` : ''}`;
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
        };

        // cant do below because discord doesnt allow data uri :(
        //let smallImageText = "";
        //let smallImageKey = "";
        //if (processing && instance?.name) {
        //    smallImageText = "Instance Icon";
        //    smallImageKey = instance?.icon;
        //} else if (!processing && profile?.username) {
        //    smallImageText = `${profile?.username}'s Skin`;
        //    smallImageKey = profile?.skinRender;
        //};

        console.log("Updating RPC:", { details, state });
        DiscordRPC.edit({
            details,
            state,
            largeImageText,
            largeImageKey: config.rpcIcon,
            button1Label: config.button1Label,
            button1Url: config.button1Url,
            button2Label: config.button2Label,
            button2Url: config.button2Url
        });
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

            if (!isInstance && !isProfile) return showToast("Invalid, must be a .lceinstance.json or .lceprofile.json file.");

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
    }, [Manager]);

    return (
        <>
            <Window title="" setMenu={setMenu} isPanorama={Array.isArray(instance?.background)} backgroundSrc={instance?.background}>
                {dropHighlight && (
                    <div id="instance-drop-area">
                        <div className="instance-drop-inner">
                            <h2>Drop Instance File Here</h2>
                            <p>.lceinstance.json / .lceprofile.json</p>
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
                </>}
            </Window>

            <Toast />
        </>
    );
};