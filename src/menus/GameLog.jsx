import "./GameLog.css";

import { useEffect, useState } from "preact/hooks";

import Button from "../components/Button.jsx";

import closeIcon from "../assets/buttons/close.svg";

export default function GameLog() {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const handler = (e) => {
            setLogs(prev => [
                ...prev.slice(-300),
                e.detail
            ]);
        };

        window.addEventListener("gameLog", handler);
        return () => window.removeEventListener("gameLog", handler);
    }, []);

    return (
        <>
            <div id="top-bar">
                <h1>Game Log</h1>
                <div id="main-actions">
                    <Button id="back-button" onclick={() => setMenu('main')}>
                        <img id="back-icon" src={closeIcon} draggable={false} />
                    </Button>
                </div>
            </div>
            <div id="game-log">
                {logs.map((log, i) => (
                    <div key={i} class={log.type}>
                        {log.message}
                    </div>
                ))}
            </div>
        </>
    );
};