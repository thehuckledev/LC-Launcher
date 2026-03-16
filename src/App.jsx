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

export default function App() {
    const [isFirstRun, setIsFirstRun] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [menu, setMenu] = useState("main");
    const { settings, loadSettings } = useSettings();
    const Manager = useManager();

    useEffect(() => {
        async function checkFirstRun() {
            try {
                let data = await Neutralino.storage.getData('hasSetup');
                let val = JSON.parse(data);
                
                if (val === true) setIsFirstRun(false);
            } catch (err) {
                setIsFirstRun(true);
                await Neutralino.storage.setData('hasSetup', JSON.stringify(true));

                // is first time
                setMenu("setup");
            };
        };
        checkFirstRun();
    }, []);

    useEffect(() => {
        async function load() {
            await loadSettings();
            await Manager.init();
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
                    {menu === "setup" &&     <SetupMenu setMenu={setMenu} />}
                    {menu === "main" &&     <MainMenu setMenu={setMenu} />}
                    {menu === "options" &&  <OptionsMenu setMenu={setMenu} />}
                    {menu === "about" &&    <AboutMenu setMenu={setMenu} />}
                </Window>
            }

            <Toast />
        </>
    );
};