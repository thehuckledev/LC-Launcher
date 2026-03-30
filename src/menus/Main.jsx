import "./Main.css";

import { useState, useEffect } from "preact/hooks";
import { useManager } from "../utils/ManagerProvider.jsx";

import Button from "../components/Button.jsx";

import accountIcon from "../assets/icons/account.png";
import instanceIcon from "../assets/icons/instance.png";
import newsIcon from "../assets/buttons/news.svg";
import optionsIcon from "../assets/buttons/options.svg";
import minecraftLogo from "../assets/ui/minecraftlogo.png";
import worldsIcon from "../assets/buttons/worlds.svg";
import serversIcon from "../assets/buttons/servers.svg";

export default function MainMenu({ setMenu, instance, profile }) {
    const Manager = useManager();
    
    const [progress, setProgress] = useState({ active: false, status: '', percent: 0 });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const handleProgress = (e) => setProgress(e.detail);
        window.addEventListener('installProgress', handleProgress);
        return () => window.removeEventListener('installProgress', handleProgress);
    }, []);

    useEffect(() => {
        const handleProcessing = (e) => setProcessing(e.detail);
        window.addEventListener('execProcessing', handleProcessing);
        return () => window.removeEventListener('execProcessing', handleProcessing);
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
                    <Button id="news-button" disabled={processing} pushable={!processing} onclick={() => setMenu('patchnotes')}>
                        <img src={newsIcon} draggable={false} />
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
                        <img id="instance-icon" src={instanceIcon} draggable={false} />
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