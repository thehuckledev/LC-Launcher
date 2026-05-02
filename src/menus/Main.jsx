import "./Main.css";

import Neutralino from "@neutralinojs/lib";
import { useState, useEffect } from "preact/hooks";
import { useManager } from "../utils/ManagerProvider.jsx";
import { useSettings } from "../utils/SettingsStore.jsx";

import Button from "../components/Button.jsx";
import Dropdown from "../components/Dropdown.jsx";

import accountIcon from "../assets/icons/account.png";
import instanceIcon from "../assets/icons/instance.png";
import newsIcon from "../assets/buttons/news.svg";
import optionsIcon from "../assets/buttons/options.svg";
import minecraftLogo from "../assets/ui/minecraftlogo.png";
import worldsIcon from "../assets/buttons/worlds.svg";
import serversIcon from "../assets/buttons/servers.svg";
import gameLogIcon from "../assets/buttons/gamelog.svg";
import folderIcon from "../assets/buttons/folder.svg";

export default function MainMenu({ setMenu, instance, setInstance, profile, setProfile, instancesList, profilesList, processing }) {
    const Manager = useManager();
    const { settings } = useSettings();
    
    const [progress, setProgress] = useState({ active: false, status: '', percent: 0 });

    useEffect(() => {
        const handleProgress = (e) => setProgress(e.detail);
        window.addEventListener('installProgress', handleProgress);
        return () => window.removeEventListener('installProgress', handleProgress);
    }, []);

    function parseProfileType(type) {
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
                <Dropdown 
                    id="profiles"
                    selected={{
                        icon: profile?.skinRender || accountIcon,
                        line1: profile?.username || "No Profile",
                        line2: parseProfileType(profile?.type) || "N/A"
                    }}
                    items={profilesList.map(p => ({
                        id: p.id,
                        icon: p.skinRender || accountIcon,
                        line1: p.username,
                        line2: parseProfileType(p.type)
                    }))}
                    onSelect={async (selectedProfile) => {
                        const profile = await Manager.profiles.get(selectedProfile.id);
                        setProfile(profile);
                    }}
                    onEdit={async (p) => {
                        const profile = await Manager.profiles.get(p.id);
                        setProfile(profile);
                        setMenu("editprofile");
                    }}
                    onCreate={() => setMenu("createprofile")}
                    direction="down"
                />
                <div id="main-actions">
                    <Button id="logs-button" disabled={!instance?.id || !processing} pushable={processing} onclick={() => setMenu('gamelog')}>
                        <img src={gameLogIcon} draggable={false} />
                    </Button>
                    <Button id="news-button" disabled={!instance?.id} pushable={!!instance?.id} onclick={() => setMenu('patchnotes')}>
                        <img src={newsIcon} draggable={false} />
                    </Button>
                    <Button id="folder-button" disabled={!instance?.id} pushable={!!instance?.id} onclick={async() => await Manager.instances.openFolder(instance?.id)}>
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
                    src={instance?.logo || minecraftLogo}
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
                    <Dropdown 
                        id="instances"
                        selected={{
                            icon: instance?.icon || instanceIcon,
                            line1: instance?.name || "No Instance",
                            line2: instance?.tag || "N/A"
                        }}
                        items={instancesList.map(i => ({
                            id: i.id,
                            icon: i.icon || instanceIcon,
                            line1: i.name,
                            line2: i.tag
                        }))}
                        onSelect={async (selectedInstance) => {
                            const instance = await Manager.instances.get(selectedInstance.id);
                            setInstance(instance);
                        }}
                        onEdit={async (i) => {
                            const instance = await Manager.instances.get(i.id);
                            setInstance(instance);
                            setMenu("editinstance");
                        }}
                        onCreate={() => setMenu("createinstance")}
                        direction="up"
                    />
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