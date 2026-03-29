import { useState, useEffect, useRef } from "preact/hooks";
import Neutralino from "@neutralinojs/lib";

import { startMusic, stopMusic, setVolume } from "./core/music.js";
import { useSettings } from "./utils/SettingsStore.jsx";
import { useManager } from "./utils/ManagerProvider.jsx";

import Window from "./components/Window.jsx";
import Toast from "./components/Toast.jsx";

import SetupMenu from "./menus/Setup.jsx";
import MainMenu from "./menus/Main.jsx";
import OptionsMenu from "./menus/Options.jsx";
import AboutMenu from "./menus/About.jsx";
import PatchNotesMenu from "./menus/PatchNotes.jsx";

export default function App() {
    const [profile, setProfile] = useState(null);
    const [instance, setInstance] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const [menu, setMenu] = useState("main");
    const { settings, loadSettings } = useSettings();
    const Manager = useManager();

    useEffect(() => {
        async function load() {
            const loadedSettings = await loadSettings();
            await Manager.init();

            const profiles = await Manager.profiles.list();
            const instances = await Manager.instances.list();

            if (profiles.length > 0) setProfile(profiles[0]);
            if (instances.length > 0) {
                const inst = await Manager.instances.get(instances[0]);
                setInstance(inst);
            };

            if (loadedSettings.hasSetup === true) {
                setMenu("main");
            } else {
                setMenu("setup");
            };

            console.log("Loaded!");
            setLoaded(true);
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

    return (
        <>
            {loaded &&
                <Window title="" setMenu={setMenu}>
                    {menu === "setup" &&      <SetupMenu setMenu={setMenu} />}
                    {menu === "main" &&       <MainMenu setMenu={setMenu} instance={instance} profile={profile} />}
                    {menu === "options" &&    <OptionsMenu setMenu={setMenu} />}
                    {menu === "about" &&      <AboutMenu setMenu={setMenu} />}
                    {menu === "patchnotes" && <PatchNotesMenu setMenu={setMenu} instance={instance} />}
                </Window>
            }

            <Toast />
        </>
    );
};