import "./Servers.css";

import { useEffect, useState } from "preact/hooks";
import { useManager } from "../utils/ManagerProvider.jsx";

import { useSettings } from "../utils/SettingsStore.jsx";
import config from "../data/config.js";

import Button from "../components/Button.jsx";
import ServerCard from "../components/Server.jsx";
import closeIcon from "../assets/buttons/close.svg";

export default function ServersMenu({ setMenu, instance, profile, setServer }) {
    const { settings } = useSettings();
    const Manager = useManager();
    const [servers, setServers] = useState([]);

    const loadServers = async () => {
        try {
            const serverList = await Manager.servers.list(instance?.id);
            setServers(serverList);
        } catch (e) {
            console.error("Failed to load server list:", e);
        };
    };

    useEffect(() => {
        loadServers();
    }, []);

    const handleDelete = async (id) => {
        const success = await Manager.servers.remove(instance?.id, id);
        if (success) loadServers();
    };

    return (
        <>
            <div id="top-bar">
                <h1 id="servers-title">Servers - {instance?.name || "Unknown"}</h1>
                <div id="main-actions">
                    <Button onclick={() => setMenu('main')}>
                        <img src={closeIcon} />
                    </Button>
                </div>
            </div>

            <div id="servers-container">
                <div id="server-list">
                    {settings.showFeaturedServers === true &&
                        <>
                            {config.featuredServers.map(server => (
                                <ServerCard 
                                    key={server.name}
                                    server={server}
                                    isFeatured={true}
                                />
                            ))}
                            <div id="servers-separator"></div>
                        </>
                    }
                    {servers.length === 0 ? (
                        <div id="servers-empty">No servers added. Press Add Server in-game or below.</div>
                    ) : (
                        servers.map(server => (
                            <ServerCard 
                                key={server.id}
                                server={server}
                                isFeatured={false}
                                onJoin={() => {
                                    Manager.servers.join(instance?.id, profile?.id, server?.id);
                                    setMenu("main");
                                }}
                                onEdit={() => {
                                    setServer(server);
                                    setMenu("editserver");
                                }}
                                onDelete={handleDelete}
                            />
                        ))
                    )}
                </div>

                <div id="servers-footer-actions">
                    <Button id="add-server-btn" onclick={() => setMenu("addserver")}>
                        Add Server
                    </Button>
                </div>
            </div>
        </>
    );
};