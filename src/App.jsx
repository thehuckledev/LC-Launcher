import { useState, useEffect, useRef } from "preact/hooks";
import Neutralino from "@neutralinojs/lib";
import config from "./data/config.js";

import { checkForUpdates } from "./utils/updater.js";
import { startMusic, stopMusic, setVolume } from "./utils/music.js";
import { useSettings } from "./utils/SettingsStore.jsx";
import { useManager } from "./utils/ManagerProvider.jsx";

import Window from "./components/Window.jsx";
import Toast from "./components/Toast.jsx";

import SetupMenu from "./menus/Setup.jsx";
import SetupOptionsMenu from "./menus/SetupOptions.jsx";
import MainMenu from "./menus/Main.jsx";
import OptionsMenu from "./menus/Options.jsx";
import AboutMenu from "./menus/About.jsx";
import PatchNotesMenu from "./menus/PatchNotes.jsx";
import GameLogMenu from "./menus/GameLog.jsx";
// TODO add 4jcraft and https://github.com/LCE-Hub/LCE-Revelations
// TODO convert LCE world to Java worlds. https://je2be.app
// TODO make the menu sfx use LCE version rather than modern java ones
// TODO make a windows install.bat
// TODO add game crash detection and popup
// TODO make all the build scripts use node rather than .sh so windows support
export default function App() {
    const [processing, setProcessing] = useState(false);
    const [profile, setProfile] = useState(null);
    const [instance, setInstance] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const [menu, setMenu] = useState("main");
    const [logs, setLogs] = useState([]);
    const { settings, loadSettings } = useSettings();
    const Manager = useManager();

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
            if(e.detail === false) {
                setMenu("main");
                setLogs([]);
            };
            setProcessing(e.detail);
        };
        window.addEventListener('execProcessing', handleProcessing);
        return () => window.removeEventListener('execProcessing', handleProcessing);
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
                </>}
            </Window>
            
            <Toast />
        </>
    );
};