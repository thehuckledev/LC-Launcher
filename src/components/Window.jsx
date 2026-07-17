import "./Window.css";

import { useEffect, useState, useRef } from "preact/hooks";
import Neutralino from "@neutralinojs/lib";
import { motion } from "motion/react";
import * as THREE from 'three';

import { useSettings } from "../utils/SettingsStore.jsx";

import backSfx from "../assets/sfx/back.flac";
import minIcon from "../assets/window/min.png";
import maxIcon from "../assets/window/max.png";
import restoreIcon from "../assets/window/restore.png";
import closeIcon from "../assets/window/close.png";
import defaultBG from "../assets/ui/background.jpeg";

let panoramaEnabled = false;
(async() => {
    let panoEnv = await Neutralino.os.getEnv('INSTANCE_PANORAMAS');
    if (panoEnv !== "false") panoramaEnabled = true;
})();

const backSound = new Audio(backSfx);
backSound.preload = "auto";

export default function Window({ title, loaded = false, showClose = true, showMinimize = true, showMaximize = true, isPanorama = false, backgroundSrc = defaultBG, backgroundFade = true, backgroundAnimated = true, menu, setMenu, children }) {
    const { settings } = useSettings();
    const [openAnim, setOpenAnim] = useState(true);
    const lastStillBg = useRef(backgroundSrc);
    const canvasRef = useRef(null);
    const menuRef = useRef(menu);
    const settingsRef = useRef(settings);

    useEffect(() => {
        menuRef.current = menu;
    }, [menu]);

    useEffect(() => {
        settingsRef.current = settings;
    }, [settings]);

    async function maximize() {
        await Neutralino.window.maximize();
        toggleMaxRestoreButtons(true);
    };

    async function unmaximize() {
        await Neutralino.window.unmaximize();
        toggleMaxRestoreButtons(false);
    };

    async function toggleMaxRestoreButtons(isMaximized) {
        if (isMaximized === true) document.body.classList.add("maximized");
        else document.body.classList.remove("maximized");
    };

    useEffect(() => {
        if (!isPanorama && typeof backgroundSrc === "string") {
            lastStillBg.current = backgroundSrc;
        };
    }, [backgroundSrc, isPanorama]);

    useEffect(() => {
        if (!panoramaEnabled || !isPanorama || !canvasRef.current) return;

        // Panorama code modified from Prismarine Web Client. All credit to Prismarine JS.
        // https://github.com/PrismarineJS/prismarine-web-client/blob/master/index.js

        let scene, camera, renderer, animationFrameId, panoramaBox, panorGeo, panorMaterials;
        let disposed = false;

        function addPanoramaCubeMap() {
            let time = 0;
            camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.05, 1000);
            camera.updateProjectionMatrix();
            camera.position.set(0, 0, 0);
            camera.rotation.set(0, 0, 0);
            panorGeo = new THREE.BoxGeometry(1000, 1000, 1000);

            const loader = new THREE.TextureLoader();
            const indices = [1, 3, 4, 5, 0, 2];
            panorMaterials = indices.map(idx => {
                const texture = loader.load(backgroundSrc[idx]);
                texture.premultiplyAlpha = false;

                return new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
            });

            panoramaBox = new THREE.Mesh(panorGeo, panorMaterials);
            panoramaBox.scale.x = -1;

            panoramaBox.onBeforeRender = () => {
                time += 0.01;
                panoramaBox.rotation.y = Math.PI + time * 0.01;
                panoramaBox.rotation.z = Math.sin(-time * 0.001) * 0.001;
            };

            scene.add(panoramaBox);
            return panoramaBox;
        };

        function init() {
            scene = new THREE.Scene();
            renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
            renderer.setPixelRatio(window.devicePixelRatio || 1);
            renderer.setSize(window.innerWidth, window.innerHeight);

            addPanoramaCubeMap();
            
            animate();
        };

        function onWindowResize() {
            if (!camera || !renderer) return;

            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        function animate() {
            if (disposed) return;

            animationFrameId = window.requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };

        init();

        window.addEventListener('resize', onWindowResize, false);

        return () => {
            disposed = true;
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', onWindowResize);

            if (panoramaBox && scene) scene.remove(panoramaBox);

            if (panorMaterials.length > 0) {
                panorMaterials.forEach(material => {
                    if (material.map) material.map.dispose();
                    material.dispose();
                });
            };

            if (panorGeo) panorGeo.dispose();

            if (renderer) {
                renderer.renderLists.dispose();
                renderer.dispose();
            };
            
            scene = null;
            camera = null;
            renderer = null;
        };
    }, [isPanorama, backgroundSrc]);

    useEffect(() => {
        if(!loaded) return;

        const timer = setTimeout(() => setOpenAnim(false), 2000);
        return () => clearTimeout(timer);
    }, [loaded]);
    
    useEffect(() => {
        function stopKeybinds() {
            document.addEventListener("keydown", (e) => {
                const isCtrl = e.ctrlKey || e.metaKey;
            
                if (isCtrl) {
                    const key = e.key.toLowerCase();
                    if (key === "+" || key === "=" || key === "-" || key === "r" || key === "p" || key === "u" || key === "f" || key === "g" || key === "j") e.preventDefault();
                };
            });
        };

        async function WINDOWS_resizeRatio() {
            if (NL_OS !== "Windows") return; // fix windows scaling issues. windows is soo odd man

            const scale = window.devicePixelRatio || 1;

            const width = Math.round(1000 * scale);
            const height = Math.round(600 * scale); // -20 due to using the window titlebar instead of custom

            await Neutralino.window.setSize({
                width,
                height
            });
            await Neutralino.window.center();
        };

        async function createMenuBar() {
            if (NL_OS !== 'Darwin') return;
        
            const menu = [
                {
                    id: 'app', text: 'LC Launcher',
                    menuItems: [
                        { id: 'about', text: 'About LC Launcher' },
                        { id: 'quit', text: 'Quit LC Launcher', shortcut: 'q' },
                    ]
                },
                {
                    id: 'edit',
                    text: 'Edit',
                    menuItems: [
                        { id: 'cut', text: 'Cut', shortcut: 'x' },
                        { id: 'copy', text: 'Copy', shortcut: 'c' },
                        { id: 'paste', text: 'Paste', shortcut: 'v' },
                        { id: 'selectAll', text: 'Select All', shortcut: 'a' }
                    ]
                }
            ];
        
            await Neutralino.window.setMainMenu(menu);
            await Neutralino.events.on('mainMenuItemClicked', async (evt) => {
                switch(evt.detail.id) {
                    case 'about':
                        setMenu('about');
                        break;
                    case 'quit':
                        if (window.whenQuitting) await window.whenQuitting();
                        if (window.beforeExitRPC) await window.beforeExitRPC();
                        await Neutralino.app.exit();
                        break;
                    case 'copy':
                        document.execCommand('copy');
                        break;
                    case 'paste':
                        document.execCommand('paste');
                        break;
                    case 'cut':
                        document.execCommand('cut');
                        break;
                    case 'selectAll':
                        document.execCommand('selectAll');
                        break;
                };
            });
            console.log("Set Main Menu");
        };

        async function preventInspect() {
            if (NL_ARGS.includes("--neu-dev-extension")) return;
            
            // Debug Mode right click for inspect element
            // Shift + 1 to allow right click
            let isDebugOn = false;
            let debugKey = "Digit1";
            window.addEventListener("keydown", function(e) {
                if (e.shiftKey && e.code === debugKey && isDebugOn === false) {
                    isDebugOn = true;
                    Neutralino.os.showNotification('Debug Mode', 'You have enabled debug mode until you restart LC Launcher', 'WARNING');
                };
            });
            window.addEventListener("contextmenu", function(e) {
                if (!isDebugOn) e.preventDefault();
            }, false);
            console.log("Listening for Debug Keybind");
        };

        async function preventScrollBounce() {
            let lastBot = null;
            let lastTop = null;
            // stop annoying scroll bounce
            function hasScrollableParent(e) {
                return e.composedPath().some(el => {
                    if (!(el instanceof HTMLElement)) return false;

                    const style = getComputedStyle(el);
                    const overflowY = style.overflowY;
                    const willScroll = (
                        (overflowY === 'auto' || overflowY === 'scroll') &&
                        el.scrollHeight > el.clientHeight
                    );

                    return willScroll;
                });
            };

            window.addEventListener('wheel', (e) => {
                if (!hasScrollableParent(e)) e.preventDefault();
            }, { passive: false });
            console.log("Prevented Scroll Bounce");
        };

        async function globalBackBtn() {
            window.addEventListener("keydown", (e) => {
                if (e.key === "Escape") {
                    const currentMenu = menuRef.current;
                    const currentSettings = settingsRef.current;

                    if (
                        currentMenu !== "main" &&
                        currentMenu !== "setup" &&
                        currentMenu !== "setupoptions"
                    ) {
                        e.preventDefault();

                        if (!!currentSettings.buttonClickSFX) {
                            const back = backSound.cloneNode();
                            back.volume = (currentSettings?.volume ?? 100) / 100;
                            back.play().catch(err => console.error("Back sfx failed:", err));
                            back.onended = () => back.remove();
                        };
                        
                        if (currentMenu === "addserver" || currentMenu === "editserver") setMenu("servers");
                        else setMenu("main");
                    };
                };
            }); 
        };

        async function setupWindow() {
            createMenuBar();
            preventInspect();
            preventScrollBounce();
            stopKeybinds();
            WINDOWS_resizeRatio();
            globalBackBtn();

            await Neutralino.window.setDraggableRegion("window-title");

            toggleMaxRestoreButtons(false);

            if (NL_OS === "Windows") document.body.classList.add("windowsOS");

            // this doesnt work, some neutralino bug
            //Neutralino.events.on("windowMaximize", () => toggleMaxRestoreButtons(true));
            //Neutralino.events.on("windowRestore", () => toggleMaxRestoreButtons(false));

            // remove fallback
            document.querySelector("#app").style.background = "transparent";
        };

        setupWindow();
    }, []);

    return (
        <>
            <div id="window-background" class={`${backgroundFade ? "fade" : ""} ${backgroundAnimated && openAnim ? "animated" : ""} ${!loaded ? "loading" : "ready"}`}>
                <div class="window-background-inner">
                    <motion.div
                        animate={{ opacity: isPanorama ? 0 : 1 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            backgroundImage: `url(${lastStillBg.current})`
                        }}
                    />
                    <motion.canvas
                        ref={canvasRef}
                        id="panorama-canvas"
                        animate={{ opacity: isPanorama ? 1 : 0 }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </div>

            <header id="titlebar">
                <div id="drag-region">

                    <div id="window-title">
                        <span>{title}</span>
                    </div>

                    <div id="window-controls">

                        {showMinimize &&
                            <div class="button" id="min-button" data-compact={NL_OS === "Windows"} onClick={() => Neutralino.window.minimize()}>
                                <img class="icon" src={minIcon} draggable={false} />
                            </div>
                        }
                        {NL_OS !== "Windows" && showMaximize &&
                            <div class="button" id="max-button" onClick={() => maximize()}>
                                <img class="icon" src={maxIcon} draggable={false} />
                            </div>
                        }
                        {NL_OS !== "Windows" && showMaximize &&
                            <div class="button" id="restore-button" onClick={() => unmaximize()}>
                                <img class="icon" src={restoreIcon} draggable={false} />
                            </div>
                        }
                        {showClose &&
                            <div class="button" id="close-button" onClick={async() => {
                                if(window.whenQuitting) await window.whenQuitting();
                                if (window.beforeExitRPC) await window.beforeExitRPC();
                                await Neutralino.app.exit();
                            }}>
                                <img class="icon" src={closeIcon} draggable={false} />
                            </div>
                        }

                    </div>
                </div>
            </header>

            <div id="main" class={openAnim ? "open-anim" : ""}>
                {children}
            </div>
        </>
    );
};