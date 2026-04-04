import "./GameLog.css";

import Neutralino from "@neutralinojs/lib";
import { useRef, useEffect, useState } from "preact/hooks";
import { showToast } from "../components/Toast.jsx";

import Button from "../components/Button.jsx";
import Textbox from "../components/Textbox.jsx";

import closeIcon from "../assets/buttons/close.svg";
import saveIcon from "../assets/buttons/save.svg";

export default function GameLogMenu({ setMenu, logs }) {
    const logRef = useRef();
    const [searchQuery, setSearchQuery] = useState("");
    const [hideWine, setHideWine] = useState(false);
    const shouldStickRef = useRef(true);

    useEffect(() => {
        const el = logRef.current;
        if (!el) return;

        const handleScroll = () => {
            const isNearBottom =
                el.scrollHeight - el.scrollTop - el.clientHeight < 150;

            shouldStickRef.current = isNearBottom;
        };

        el.addEventListener("scroll", handleScroll);
        return () => el.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const el = logRef.current;
        if (!el) return;

        if (shouldStickRef.current) {
            el.scrollTo({
                top: el.scrollHeight,
                behavior: "instant",
            });
        }
    }, [logs]);

    async function saveLogs() {
        const startName = (d => `${d.toISOString().slice(0,10)}_${d.toTimeString().slice(0,5).replace(':','-')}`)(new Date());
        const res = await Neutralino.os.showSaveDialog("Select a location for the log");
        if (!res) return;
        const src = res.trim();
        if (!src.endsWith(".txt")) return showToast("You must save as a .txt file");

        const header = 
`=== LC Launcher Log ===
Saved on: ${startName}

`;
        const body = logs
            .map((log, i) =>
                `[${log.timestamp || "--"}] [${log.type.toUpperCase()}]${log.channel ? ` ${log.channel}` : ""}${log.func ? `:${log.func}()` : ""} ${log.message}`
            )
            .join("\n");

        const logContent = header + body;
        await Neutralino.filesystem.writeFile(src, logContent);
        showToast("Log saved to location");
    };

    async function searchLogs() {
        
    };

    return (
        <>
            <div id="top-bar">
                <h1>Game Log</h1>
                <div id="main-actions">
                    <Textbox
                        id="search-query"
                        onchange={(txt) => setSearchQuery(txt)}
                        value={searchQuery}
                        placeholder="Search..."
                        label="Search Logs"
                        maxlength={150}
                    />
                    <Button id="filter-button" onclick={() => setHideWine(prev => !prev)} disabled={hideWine}>
                        W
                    </Button>
                    <Button id="save-button" onclick={saveLogs}>
                        <img id="save-icon" src={saveIcon} draggable={false} />
                    </Button>
                    <Button id="back-button" onclick={() => setMenu('main')}>
                        <img id="back-icon" src={closeIcon} draggable={false} />
                    </Button>
                </div>
            </div>
            <div id="game-log" ref={logRef}>
                {logs
                    .map((log, i) => ({ log, oi: i }))
                    .filter(({ log }) => !(hideWine && log.from === "WINE"))
                    .filter(({ log }) => {
                        if (!searchQuery.trim()) return true;

                        const q = searchQuery.toLowerCase();
                        console.log(q)
                        const text = `${log.timestamp || ""} ${log.type} ${log.channel || ""} ${log.func || ""} ${log.message}`.toLowerCase();

                        return text.includes(q);
                    })
                    .map(({ log, oi }) => (
                    <div key={oi} class={`log-entry ${log.type}`}>
                        <span className="line-number">{oi + 1}</span>
                        <span className="log-message">[{log.timestamp || "--"}] [{log.type.toUpperCase()}]{log.channel && ` ${log.channel}`}{log.func && `:${log.func}()`} {log.message}</span>
                    </div>
                ))}
            </div>
        </>
    );
};