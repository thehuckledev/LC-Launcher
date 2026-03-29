import "./Main.css";

import { useState, useEffect } from "preact/hooks";
import { useManager } from "../utils/ManagerProvider.jsx";

import Button from "../components/Button.jsx";

import accountIcon from "../assets/icons/account.png";
import instanceIcon from "../assets/icons/instance.png";
import newsIcon from "../assets/buttons/news.svg";
import optionsIcon from "../assets/buttons/options.svg";
import minecraftLogo from "../assets/ui/minecraftlogo.png";
import discoverIcon from "../assets/buttons/discover.svg";
import serversIcon from "../assets/buttons/servers.svg";

export default function MainMenu({ setMenu }) {
    const Manager = useManager();
    
    const [profile, setProfile] = useState(null);
    const [instance, setInstance] = useState(null);
    const [progress, setProgress] = useState({ active: false, status: '', percent: 0 });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        async function loadData() {
            const profiles = await Manager.profiles.list();
            const instances = await Manager.instances.list();

            if (profiles.length > 0) setProfile(profiles[0]);
            if (instances.length > 0) {
                const inst = await Manager.instances.get(instances[0]);
                setInstance(inst);
            };
        };
        loadData();
    }, []);

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
                    <Button id="news-button" disabled={processing} pushable={!processing}>
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
                        <Button id="discover-button" disabled={!instance?.id || progress.active || processing} pushable={!processing}>
                            <img src={discoverIcon} draggable={false} />
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