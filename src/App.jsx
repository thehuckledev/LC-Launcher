import { useState, useEffect, useRef } from "preact/hooks";
import Neutralino from "@neutralinojs/lib";

import { startMusic, stopMusic, setVolume } from "./utils/music.js";
import { useSettings } from "./utils/SettingsStore.jsx";
import { useManager } from "./utils/ManagerProvider.jsx";

import Window from "./components/Window.jsx";
import Toast from "./components/Toast.jsx";

import SetupMenu from "./menus/Setup.jsx";
import MainMenu from "./menus/Main.jsx";
import OptionsMenu from "./menus/Options.jsx";
import AboutMenu from "./menus/About.jsx";
import PatchNotesMenu from "./menus/PatchNotes.jsx";
import GameLogMenu from "./menus/GameLog.jsx";
// TODO add game crash detection and popup
// TODO add would you like to join our discord prompt
export default function App() { // TODO add launcher update prompt which checks if theres a newer version of the launcher
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
            const inst = await Manager.instances.get(instances[2]);
            setInstance(inst);
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
        if(processing === false) setLogs([]);
    }, [processing])

    return (
        <>
            {loaded &&
                <Window title="" setMenu={setMenu}>
                    {menu === "setup" &&      <SetupMenu setMenu={setMenu} reloadData={loadData} />}
                    {menu === "main" &&       <MainMenu setMenu={setMenu} instance={instance} profile={profile} processing={processing} setProcessing={setProcessing} />}
                    {menu === "options" &&    <OptionsMenu setMenu={setMenu} />}
                    {menu === "about" &&      <AboutMenu setMenu={setMenu} />}
                    {menu === "patchnotes" && <PatchNotesMenu setMenu={setMenu} instance={instance} />}
                    {menu === "gamelog" &&    <GameLogMenu setMenu={setMenu} logs={logs} />}
                </Window>
            }

            <Toast />
        </>
    );
};