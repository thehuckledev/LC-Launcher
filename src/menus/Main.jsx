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
                    <Button id="news-button">
                        <img src={newsIcon} draggable={false} />
                    </Button>
                    <Button id="options-button" onclick={() => setMenu('options')}>
                        <img src={optionsIcon} draggable={false} />
                    </Button>
                </div>
            </div>
            <div id="bottom-bar">
                <img id="main-logo" src={minecraftLogo} draggable={false} />
                <div id="launch-options-bar">
                    <div id="instances">
                        <img id="instance-icon" src={instanceIcon} draggable={false} />
                        <div id="instance-details">
                            <h1>{instance?.id || "No Instance"}</h1>
                            <h2>{instance?.tag || "N/A"}</h2>
                        </div>
                    </div>
                    <div id="main-actions">
                        <Button id="discover-button" disabled={!instance?.id}>
                            <img src={discoverIcon} draggable={false} />
                        </Button>
                        <Button id="play-button" disabled={!instance?.id || !profile?.id} onclick={() => Manager.exec.launch(instance?.id, profile?.id)}>
                            Play
                        </Button>
                        <Button id="servers-button" disabled={!instance?.id}>
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