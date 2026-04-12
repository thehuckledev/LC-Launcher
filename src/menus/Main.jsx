import "./Main.css";

import Neutralino from "@neutralinojs/lib";
import { useState, useEffect } from "preact/hooks";
import { useManager } from "../utils/ManagerProvider.jsx";
import { useSettings } from "../utils/SettingsStore.jsx";

import Button from "../components/Button.jsx";

import accountIcon from "../assets/icons/account.png";
import instanceIcon from "../assets/icons/instance.png";
import newsIcon from "../assets/buttons/news.svg";
import optionsIcon from "../assets/buttons/options.svg";
import minecraftLogo from "../assets/ui/minecraftlogo.png";
import worldsIcon from "../assets/buttons/worlds.svg";
import serversIcon from "../assets/buttons/servers.svg";
import gameLogIcon from "../assets/buttons/gamelog.svg";
import folderIcon from "../assets/buttons/folder.svg";

export default function MainMenu({ setMenu, instance, profile, processing }) {
    const Manager = useManager();
    const { settings } = useSettings();
    
    const [progress, setProgress] = useState({ active: false, status: '', percent: 0 });

    useEffect(() => {
        const handleProgress = (e) => setProgress(e.detail);
        window.addEventListener('installProgress', handleProgress);
        return () => window.removeEventListener('installProgress', handleProgress);
    }, []);

    function parseAccountType(type) {
        switch (type) {
            case "OFFLINE":
                return "Offline Account";
            default:
                return "N/A";
        };
    };

    function formatPlaytime(seconds) {
        const d = Math.floor(seconds / 86400);
        const h = Math.floor((seconds % 86400) / 3600);
        const m = Math.floor((seconds % 3600) / 60);

        return `${d}d ${h}h ${m}m`;
    };

    return (
        <>
            <div id="top-bar">
                <div id="accounts">
                    <img id="account-icon" src={profile?.skinRender || accountIcon} draggable={false} />
                    <div id="account-details">
                        <h1>{profile?.username || "No Profile"}</h1>
                        <h2>{parseAccountType(profile?.type) || "N/A"}</h2>
                    </div>
                </div>
                <div id="main-actions">
                    <Button id="logs-button" disabled={!instance?.id || !processing} pushable={processing} onclick={() => setMenu('gamelog')}>
                        <img src={gameLogIcon} draggable={false} />
                    </Button>
                    <Button id="news-button" disabled={!instance?.id} pushable={instance?.id} onclick={() => setMenu('patchnotes')}>
                        <img src={newsIcon} draggable={false} />
                    </Button>
                    <Button id="folder-button" disabled={!instance?.id} pushable={instance?.id} onclick={async() => {
                        let cmd = `start ""`;
                        if (NL_OS === "Linux") cmd = "xdg-open";
                        if (NL_OS === "Darwin") cmd = "open";
                        const instPath = await Neutralino.filesystem.getJoinedPath(settings.dataDirectory, "instances", instance.id);
                        await Neutralino.os.execCommand(`${cmd} "${instPath}"`)
                    }}>
                        <img src={folderIcon} draggable={false} />
                    </Button>
                    <Button id="options-button" disabled={processing} pushable={!processing} onclick={() => setMenu('options')}>
                        <img src={optionsIcon} draggable={false} />
                    </Button>
                </div>
            </div>
            <div id="bottom-bar">
                <img
                    id="main-logo"
                    className={progress.active ? "logo-active" : ""}
                    src={minecraftLogo}
                    draggable={false}
                />
                {progress.active && (
                    <div id="progress-container">
                        <h2 id="progress-status">{progress.label} {progress.eta && `(${progress.eta})`}</h2>
                        <div id="progress-bar">
                            <div
                                id="progress-fill"
                                style={{ width: `${progress.percent}%` }}
                            />
                        </div>
                    </div>
                )}
                <div id="launch-options-bar">
                    <div id="instances">
                        <img id="instance-icon" src={instance?.icon || instanceIcon} draggable={false} />
                        <div id="instance-details">
                            <h1>{instance?.name || "No Instance"}</h1>
                            <h2>{instance?.tag || "N/A"}</h2>
                        </div>
                    </div>
                    <div id="main-actions">
                        <Button id="worlds-button" disabled={!instance?.id || progress.active || processing} pushable={!processing}>
                            <img src={worldsIcon} draggable={false} />
                        </Button>
                        <Button id="play-button" disabled={!instance?.id || !profile?.id || progress.active || processing} pushable={!processing} onclick={() => Manager.exec.launch(instance?.id, profile?.id)}>
                            Play
                        </Button>
                        <Button id="servers-button" disabled={!instance?.id || progress.active || processing} pushable={!processing}>
                            <img src={serversIcon} draggable={false} />
                        </Button>
                    </div>
                    <div id="stats">
                        <h1>Playtime</h1>
                        <h2>{typeof instance?.playtime === 'number' ? formatPlaytime(instance?.playtime) : "N/A"}</h2>
                    </div>
                </div>
            </div>
        </>
    );
};