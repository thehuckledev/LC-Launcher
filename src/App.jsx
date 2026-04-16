import { useState, useEffect, useRef } from "preact/hooks";
import Neutralino from "@neutralinojs/lib";
import config from "./data/config.js";

import { checkForUpdates } from "./utils/updater.js";
import { startMusic, stopMusic, setVolume } from "./utils/music.js";
import { useSettings } from "./utils/SettingsStore.jsx";
import { useManager } from "./utils/ManagerProvider.jsx";
import DiscordRPC from "./utils/discordRPC.js";

import Window from "./components/Window.jsx";
import Toast from "./components/Toast.jsx";

import SetupMenu from "./menus/Setup.jsx";
import SetupOptionsMenu from "./menus/SetupOptions.jsx";
import MainMenu from "./menus/Main.jsx";
import OptionsMenu from "./menus/Options.jsx";
import AboutMenu from "./menus/About.jsx";
import PatchNotesMenu from "./menus/PatchNotes.jsx";
import GameLogMenu from "./menus/GameLog.jsx";
import CrashMenu from "./menus/Crash.jsx";
// TODO add screenshot menu
// TODO add dev tools like .arc .pak and .loc editor
// TODO convert LCE world to Java worlds. https://je2be.app
// TODO make the skin save a slim and non slim version so that LegacyEvolved can use slim skin
// TODO make each profile have multiple skins
// TODO add cape menu and make the profile skin be placed as a DLC rather than replacing steve
//! TODO make the app prompt to install if its in the downloads folder (or not in the right folder)
//! TODO make the create profile and profile dropdown work
//! TODO make the create instance and instance dropdown work
export default function App() {
    const [processing, setProcessing] = useState(false);
    const [crashed, setCrashed] = useState(false);
    const [profile, setProfile] = useState(null);
    const [instance, setInstance] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const [menu, setMenu] = useState("main");
    const [logs, setLogs] = useState([]);
    const { settings, loadSettings } = useSettings();
    const Manager = useManager();

    const rpcRef = useRef(null);
    if (!rpcRef.current) {
        rpcRef.current = new DiscordRPC({
            clientId: config.rpcClientID,
            details: "",
            state: "",
            largeImageText: "",
            largeImageKey: config.rpcIcon,
            smallImageText: "",
            smallImageKey: "",
            button1Label: config.button1Label,
            button1Url: config.button1Url,
            button2Label: config.button2Label,
            button2Url: config.button2Url
        });
    };

    async function loadData() {
        const profiles = await Manager.profiles.list();
        const instances = await Manager.instances.list();

        if (profiles.length > 0) setProfile(profiles[0]);
        if (instances.length > 0) {
            const instancesObj = await Promise.all(instances.map(id => Manager.instances.get(id)));
            const inst = instancesObj.find(i => i.name === config.defaultInstance);
            if (inst) setInstance(inst);
        };
    };

    useEffect(() => {
        async function load() {
            const loadedSettings = await loadSettings();
            await Manager.init();
            await loadData();

            setMenu(loadedSettings.hasSetup ? "main" : "setup");
            setLoaded(true);
            console.log("Loaded!");

            setTimeout(checkForUpdates, 2000);
        };

        load();
    }, []);

    const openAnimPlaying = useRef(true);
    useEffect(() => {
        const timer = setTimeout(() => {
            openAnimPlaying.current = false;
        }, 1600);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const rpc = rpcRef.current;
        if (!rpc) return;

        if (settings.discordRPC === true) rpc.enable();
        else rpc.disable();
    }, [settings.discordRPC]);

    useEffect(() => {
        const rpc = rpcRef.current;
        if (!rpc || !settings.discordRPC) return;
    
        let details = "";
        let state = profile?.username 
                    ? `${profile.username} • ${profile.type.charAt(0) + profile.type.substring(1).toLowerCase()}`
                    : "No profile";
        let largeImageText = profile?.uid ? `${NL_APPVERSION ? `v${NL_APPVERSION}` : ''} • Profile UID: ${profile.uid.substring(2)}` : `${NL_APPVERSION ? `v${NL_APPVERSION}` : ''}`;
        switch (menu) {
            case processing:
                details = `Playing on ${instance?.name || "Unknown"}`;
                break;
            case "main":
                details = "In Main Menu";
                break;
            case "options":
                details = "Editing Options";
                break;
            case "setup":
                details = "Setting up launcher";
                break;
            case "patchnotes":
                details = "Viewing Patch Notes";
                break;
            case "gamelog":
                details = "Viewing Game Logs";
                break;
            case "crash":
                details = "Viewing Crash Logs";
                break;
        };

        // cant do below because discord doesnt allow data uri :(
        /*let smallImageText = "";
        let smallImageKey = "";
        if (processing && instance?.name) {
            smallImageText = "Instance Icon";
            smallImageKey = instance?.icon;
        } else if (!processing && profile?.username) {
            smallImageText = `${profile?.username}'s Skin`;
            smallImageKey = profile?.skinRender;
        };*/

        console.log("Updating RPC:", { details, state });
        rpc.edit({ details, state, largeImageText });
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
        if (settings.fullscreen == true) Neutralino.window.maximize();
        else Neutralino.window.unmaximize();
    }, [settings.fullscreen]);

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
        const handleProcessing = (e) => {
            if(e.detail === false && crashed === false) {
                setMenu("main");
                setLogs([]);
            };
            setProcessing(e.detail);
        };
        window.addEventListener('execProcessing', handleProcessing);
        return () => window.removeEventListener('execProcessing', handleProcessing);
    }, [crashed]);

    useEffect(() => {
        const handler = () => {
            setCrashed(true);
            setMenu("crash");
        };

        window.addEventListener("gameCrash", handler);
        return () => window.removeEventListener("gameCrash", handler);
    }, []);

    return (
        <>
            <Window title="" setMenu={setMenu}>
                {loaded && <>
                    {menu === "setup" &&        <SetupMenu setMenu={setMenu} reloadData={loadData} />}
                    {menu === "setupoptions" && <SetupOptionsMenu setMenu={setMenu} />}
                    {menu === "main" &&         <MainMenu setMenu={setMenu} instance={instance} profile={profile} processing={processing} />}
                    {menu === "options" &&      <OptionsMenu setMenu={setMenu} />}
                    {menu === "about" &&        <AboutMenu setMenu={setMenu} />}
                    {menu === "patchnotes" &&   <PatchNotesMenu setMenu={setMenu} instance={instance} />}
                    {menu === "gamelog" &&      <GameLogMenu setMenu={setMenu} logs={logs} />}
                    {menu === "crash" &&        <CrashMenu setMenu={setMenu} setCrashed={setCrashed} setLogs={setLogs} logs={logs} />}
                </>}
            </Window>
            
            <Toast />
        </>
    );
};