import "./Crash.css";
import "./GameLog.jsx";

import Neutralino from "@neutralinojs/lib";
import { useRef, useEffect, useState } from "preact/hooks";
import { showToast } from "../components/Toast.jsx";

import Button from "../components/Button.jsx";
import Textbox from "../components/Textbox.jsx";

import closeIcon from "../assets/buttons/close.svg";
import saveIcon from "../assets/buttons/save.svg";
import copyIcon from "../assets/buttons/copy.svg";

export default function CrashMenu({ setMenu, setCrashed, setLogs, logs }) {
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
        const startTime = (d => `${d.toISOString().slice(0,10)}_${d.toTimeString().slice(0,5).replace(':','-')}`)(new Date());
        const res = await Neutralino.os.showSaveDialog("Select a location for the log ( Must use .log )", {
            filters: [{ name: 'LCE Log Files', extensions: ['log'] }],
            defaultPath: NL_OS === "Darwin" ? undefined : `lclauncher_${startTime}.log`
        });
        if (!res) return;
        const src = res.trim();
        if (!src.endsWith(".log")) return showToast("You must save as a .log file");

        const header = 
`=== LC Launcher Crash Log ===
Saved at: ${startTime}
Platform: ${NL_OS || "Unknown"} (${NL_ARCH || "Unknown"})

Version: ${NL_APPVERSION || "Unknown"}
NeutralinoJS Client: ${NL_CVERSION || "Unknown"} (${NL_CCOMMIT || "Unknown"})
NeutralinoJS Server: ${NL_VERSION || "Unknown"} (${NL_COMMIT || "Unknown"})

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

    async function copyLog() {
        const startTime = (d => `${d.toISOString().slice(0,10)}_${d.toTimeString().slice(0,5).replace(':','-')}`)(new Date());
        const header = 
`=== LC Launcher Crash Log ===
Saved at: ${startTime}
Platform: ${NL_OS || "Unknown"} (${NL_ARCH || "Unknown"})

Version: ${NL_APPVERSION || "Unknown"}
NeutralinoJS Client: ${NL_CVERSION || "Unknown"} (${NL_CCOMMIT || "Unknown"})
NeutralinoJS Server: ${NL_VERSION || "Unknown"} (${NL_COMMIT || "Unknown"})

`;
        const body = logs
            .map(log =>
                `[${log.timestamp || "--"}] [${log.type.toUpperCase()}]${log.channel ? ` ${log.channel}` : ""}${log.func ? `:${log.func}()` : ""} ${log.message}`
            )
            .join("\n");

        const logContent = header + body;

        try {
            await Neutralino.clipboard.writeText(logContent);
            showToast("Crash log copied to clipboard");
        } catch {
            showToast("Failed to copy crash log");
        };
    };

    return (
        <>
            <div id="top-bar">
                <h1>Crash Log</h1>
                <div id="main-actions">
                    <Textbox
                        id="search-query"
                        onchange={(txt) => setSearchQuery(txt)}
                        value={searchQuery}
                        placeholder="Search..."
                        label="Search Logs"
                        maxlength={150}
                    />
                    <Button id="filter-button" tooltip="Toggle Wine Logs" tooltipAlign="RIGHT" onclick={() => setHideWine(prev => !prev)} disabled={hideWine}>
                        W
                    </Button>
                    <Button id="copy-button" tooltip="Copy Log" tooltipAlign="RIGHT" onclick={copyLog}>
                        <img id="copy-icon" src={copyIcon} draggable={false} />
                    </Button>
                    <Button id="save-button" tooltip="Save Log" tooltipAlign="RIGHT" onclick={saveLogs}>
                        <img id="save-icon" src={saveIcon} draggable={false} />
                    </Button>
                    <Button id="back-button" tooltip="Close" tooltipAlign="RIGHT" onclick={() => {
                        setCrashed(false);
                        setLogs([]);
                        setMenu('main');
                    }}>
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